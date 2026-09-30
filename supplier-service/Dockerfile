FROM maven:3.9.11-eclipse-temurin-17-alpine AS build

WORKDIR /workspace

# Cache dependencies separately from application source code.
COPY pom.xml ./
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -B -Dmaven.test.skip=true \
    && cp target/*.jar /workspace/app.jar

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN addgroup -S spring \
    && adduser -S spring -G spring

COPY --from=build --chown=spring:spring /workspace/app.jar ./app.jar

USER spring:spring

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
