# Kubernetes manifests (EKS)

Runs the backend on EKS. The frontend is not here: it is a static build served from S3 + CloudFront.

```text
k8s/
├── kustomization.yaml        # everything long-running; also sets the ECR image names
├── namespaces.yaml           # campuscouriers-app, campuscouriers-messaging
├── app/
│   ├── user-service.yaml     # fully commented reference; the other services follow the same layout:
│   ├── supplier-service.yaml #   ServiceAccount, ConfigMap, Deployment, Service, HPA, PodDisruptionBudget
│   ├── credit-service.yaml
│   ├── order-service.yaml
│   ├── database-endpoints.yaml  # user-db, order-db, ... -> RDS endpoint (DNS aliases)
│   ├── ingress.yaml          # ALB: api.<domain>, routed by path
│   └── network-policies.yaml
├── messaging/
│   ├── kafka.yaml            # 3-broker KRaft StatefulSet with EBS volumes
│   ├── kafka-connect.yaml    # Debezium
│   ├── database-endpoints.yaml
│   ├── storageclass.yaml     # gp3 EBS volumes
│   └── network-policies.yaml
└── jobs/                     # one-off tasks, applied separately
    ├── order-migrate.yaml    # alembic upgrade head
    ├── user-bootstrap.yaml   # first administrator
    ├── supplier-seed.yaml    # supplier CSV import
    └── register-connectors.yaml
```

| compose.yaml | Kubernetes |
| --- | --- |
| a service | Deployment (pods) + Service (stable address) |
| `environment:` | ConfigMap (settings) + Secret (passwords, keys) |
| `ports: "8081:8080"` | Ingress (public) / Service (internal) |
| `user-db` container | RDS, reached through the `user-db` ExternalName alias |
| `kafka` container | StatefulSet with one persistent disk per broker |
| `connect-init`, `user-bootstrap` | Jobs |
| `restart: unless-stopped` | liveness probe + Deployment controller |
| (nothing) | HorizontalPodAutoscaler, PodDisruptionBudget, NetworkPolicy |

## Before you deploy

### Cluster add-ons
- **AWS Load Balancer Controller**: turns `ingress.yaml` into an ALB.
- **metrics-server**: provides the CPU numbers the autoscalers (HPAs) use.
- **Amazon EBS CSI driver**: creates the EBS disks for Kafka.
- **VPC CNI with network policy enabled** (`enableNetworkPolicy: "true"` in the add-on config): without it, NetworkPolicies are silently ignored.

### AWS resources
- **ECR**: push the four service images (see `images:` in `kustomization.yaml`).
- **RDS for PostgreSQL**: in a custom parameter group, set `rds.logical_replication = 1`. Debezium needs it (it is the RDS equivalent of `wal_level=logical` in compose). Then create one database and one user per service. As the master user:

  ```sql
  CREATE USER user_service WITH PASSWORD '...';
  CREATE DATABASE campuscouriers_user OWNER user_service;
  GRANT rds_replication TO user_service;  -- only for databases Debezium reads: user, order, supplier
  -- repeat for supplier, credit, order
  ```
- **ACM certificate** for `api.<domain>`, and a **Route 53** record pointing `api.<domain>` at the ALB.

### Placeholders to replace (all marked `TODO`)
| What | Where |
| --- | --- |
| RDS endpoint | `app/database-endpoints.yaml`, `messaging/database-endpoints.yaml` |
| AWS account id, region | `kustomization.yaml`, `jobs/kustomization.yaml` |
| `api.example.com` | `app/ingress.yaml` |
| `https://app.example.com` (CORS) | ConfigMap in each `app/*-service.yaml` |
| Public subnet CIDRs | `app/network-policies.yaml` |

## Deploy

```sh
# 1. Namespaces
kubectl apply -f k8s/namespaces.yaml

# 2. Secrets (never commit these; in the Terraform phase, External Secrets Operator syncs them from Secrets Manager)
for svc in user supplier credit order; do
  kubectl create secret generic ${svc}-db-credentials -n campuscouriers-app \
    --from-literal=DB_USERNAME=${svc}_service --from-literal=DB_PASSWORD='<password>'
done
kubectl create secret generic user-service-jwt -n campuscouriers-app \
  --from-file=private.pem=user-service/keys/private.pem --from-file=public.pem=user-service/keys/public.pem
kubectl create secret generic user-bootstrap-admin -n campuscouriers-app \
  --from-literal=BOOTSTRAP_ADMIN_NAME='<name>' --from-literal=BOOTSTRAP_ADMIN_EMAIL='<email>' \
  --from-literal=BOOTSTRAP_ADMIN_PASSWORD='<password>'
kubectl create secret generic debezium-db-credentials -n campuscouriers-messaging \
  --from-literal=USER_DB_NAME=campuscouriers_user         --from-literal=USER_DB_USERNAME=user_service \
  --from-literal=USER_DB_PASSWORD='<password>' \
  --from-literal=ORDER_DB_NAME=campuscouriers_order       --from-literal=ORDER_DB_USERNAME=order_service \
  --from-literal=ORDER_DB_PASSWORD='<password>' \
  --from-literal=SUPPLIER_DB_NAME=campuscouriers_supplier --from-literal=SUPPLIER_DB_USERNAME=supplier_service \
  --from-literal=SUPPLIER_DB_PASSWORD='<password>'

# 3. Debezium connectors + script, straight from debezium/ (re-run after changing them)
kubectl create configmap debezium-connectors -n campuscouriers-messaging \
  --from-file=debezium/connectors --from-file=debezium/register-connectors.sh \
  --dry-run=client -o yaml | kubectl apply -f -

# 4. Everything long-running (preview first with: kubectl kustomize k8s)
kubectl apply -k k8s

# 5. One-off jobs: migrations, first admin, supplier seed, connector registration
kubectl apply -k k8s/jobs
kubectl get jobs -A -w
```

**Deploying a new order-service version with a new migration:** run the `order-migrate` Job first (delete the old finished Job if it still exists), wait for it to complete, then update the image.

## Check it works

```sh
kubectl get pods -n campuscouriers-app -o wide      # 2 pods per service, on different nodes
kubectl get pods -n campuscouriers-messaging        # kafka-0..2, kafka-connect
kubectl get hpa -n campuscouriers-app               # current vs target CPU, replica counts
kubectl get ingress api -n campuscouriers-app       # ADDRESS = the ALB's DNS name
kubectl describe ingress api -n campuscouriers-app  # events show ALB creation errors, if any

# Connector status (Connect's API is internal only)
kubectl port-forward -n campuscouriers-messaging svc/kafka-connect 8083:8083
curl localhost:8083/connectors?expand=status
```

## Demonstrating autoscaling

Login is CPU-heavy (password hashing), so it is a good load target. Use an account that exists, with the wrong password:

```sh
# terminal 1
kubectl get hpa user-service -n campuscouriers-app --watch
# terminal 2
hey -z 3m -c 40 -m POST -H "Content-Type: application/json" \
  -d '{"email":"<existing-user-email>","password":"wrong-password"}' https://api.example.com/auth/login
```

Replicas climb from 2 toward 5 as CPU passes 70%. About 5 minutes after the load stops, they drop back to 2 (`scaleDown.stabilizationWindowSeconds`).

PodDisruptionBudget demo: `kubectl drain <node> --ignore-daemonsets --delete-emptydir-data`. Kubernetes evicts pods one at a time and never leaves a service with zero ready pods.

## Notes
- **Login cookie:** the refresh token cookie is `SameSite=Strict` and `Secure`. It works when the frontend and API share a registrable domain (`app.example.com` and `api.example.com`), over HTTPS. It does **not** work between the default `*.cloudfront.net` address and the ALB's `*.elb.amazonaws.com` address: they count as different sites, and the ALB address has no certificate. Use your own domain, even for testing.
- **Internal-only routes:** `/api/reservations/**` (credit) is deliberately not in the Ingress. It accepts any logged-in user's token, so it should only be called by order-service from inside the cluster.
- **Kubelet probes and NetworkPolicies:** if pods fail their probes only after the policies are applied, check that the VPC CNI network policy agent allows traffic from the node. Kubelet probes come from the node's IP.
