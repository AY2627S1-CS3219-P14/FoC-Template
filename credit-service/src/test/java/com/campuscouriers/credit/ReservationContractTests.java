package com.campuscouriers.credit;

import com.campuscouriers.credit.controller.ReservationController;
import com.campuscouriers.credit.dto.CompleteReservationRequest;
import com.campuscouriers.credit.dto.ReserveCreditsRequest;
import com.campuscouriers.credit.entity.Reservation;
import com.campuscouriers.credit.repository.ReservationRepository;
import com.campuscouriers.credit.repository.WalletRepository;
import com.campuscouriers.credit.service.ReservationService;
import com.campuscouriers.credit.service.WalletService;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ReservationContractTests {
    private final ReservationService service = mock(ReservationService.class);
    private final ReservationController controller = new ReservationController(service);
    private final UUID user = UUID.randomUUID();

    private Jwt token(UUID subject) {
        return Jwt.withTokenValue("test").header("alg", "RS256").subject(subject.toString()).build();
    }

    private void configureKey() {
        ReflectionTestUtils.setField(controller, "orderServiceKey", "backend-secret");
    }

    @Test
    void missingConfigurationFailsClosed() {
        var request = new ReserveCreditsRequest(user, UUID.randomUUID(), 10);
        var error = assertThrows(ResponseStatusException.class, () -> controller.reserve(request, token(user), "key"));
        assertEquals(503, error.getStatusCode().value());
        verifyNoInteractions(service);
    }

    @Test
    void userTokenWithoutServiceKeyCannotMutateCredits() {
        configureKey();
        var request = new ReserveCreditsRequest(user, UUID.randomUUID(), 10);
        var error = assertThrows(ResponseStatusException.class, () -> controller.reserve(request, token(user), null));
        assertEquals(403, error.getStatusCode().value());
        verifyNoInteractions(service);
    }

    @Test
    void serviceKeyDoesNotAllowImpersonatingAnotherRequester() {
        configureKey();
        var request = new ReserveCreditsRequest(UUID.randomUUID(), UUID.randomUUID(), 10);
        var error = assertThrows(ResponseStatusException.class, () -> controller.reserve(request, token(user), "backend-secret"));
        assertEquals(403, error.getStatusCode().value());
        verifyNoInteractions(service);
    }

    @Test
    void validReservationForwardsStableOrderIdentifier() {
        configureKey();
        UUID order = UUID.randomUUID();
        controller.reserve(new ReserveCreditsRequest(user, order, 10), token(user), "backend-secret");
        verify(service).reserveCredits(user, order, 10);
    }

    @Test
    void completionChecksOwnershipAndForwardsOrderId() {
        configureKey();
        UUID reservation = UUID.randomUUID(), order = UUID.randomUUID(), courier = UUID.randomUUID();
        controller.complete(reservation, new CompleteReservationRequest(courier, order), token(user), "backend-secret");
        verify(service).assertOwnedBy(reservation, user);
        verify(service).completeReservation(reservation, courier, order);
    }

    @Test
    void completionRejectsMismatchedOrderBeforeMutatingWallets() {
        var reservations = mock(ReservationRepository.class);
        var wallets = mock(WalletRepository.class);
        var walletService = mock(WalletService.class);
        var actualService = new ReservationService(wallets, reservations, walletService);
        UUID id = UUID.randomUUID();
        when(reservations.findWithLockByReservationId(id)).thenReturn(Optional.of(
                new Reservation(UUID.randomUUID(), UUID.randomUUID(), 10)));
        var error = assertThrows(ResponseStatusException.class,
                () -> actualService.completeReservation(id, UUID.randomUUID(), UUID.randomUUID()));
        assertEquals(409, error.getStatusCode().value());
        verifyNoInteractions(wallets, walletService);
    }
}
