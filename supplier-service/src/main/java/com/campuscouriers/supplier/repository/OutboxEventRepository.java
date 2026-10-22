package com.campuscouriers.supplier.repository;

import com.campuscouriers.supplier.entity.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {
    List<OutboxEvent> findByAggregateId(String aggregateId);
}
