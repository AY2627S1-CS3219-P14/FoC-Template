package com.campuscouriers.credit.controller;

import com.campuscouriers.credit.dto.CompleteReservationRequest;
import com.campuscouriers.credit.dto.AdjustReservationRequest;
import com.campuscouriers.credit.dto.ReserveCreditsRequest;
import com.campuscouriers.credit.dto.ReservationResponse;
import com.campuscouriers.credit.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse reserve(@Valid @RequestBody ReserveCreditsRequest request) {
        return reservationService.reserveCredits(request.userId(), request.orderId(), request.amount());
    }

    @PutMapping("/{reservationId}")
    public ReservationResponse adjust(@PathVariable UUID reservationId,
                                      @Valid @RequestBody AdjustReservationRequest request) {
        return reservationService.adjustReservation(reservationId, request.newAmount());
    }

    @PostMapping("/{reservationId}/release")
    public ReservationResponse release(@PathVariable UUID reservationId) {
        return reservationService.releaseReservation(reservationId);
    }

    @PostMapping("/{reservationId}/complete")
    public ReservationResponse complete(@PathVariable UUID reservationId,
                                        @Valid @RequestBody CompleteReservationRequest request) {
        return reservationService.completeReservation(reservationId, request.courierUserId());
    }
}