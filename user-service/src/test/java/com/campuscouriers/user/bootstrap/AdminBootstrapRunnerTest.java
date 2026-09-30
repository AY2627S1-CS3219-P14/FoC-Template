package com.campuscouriers.user.bootstrap;

import com.campuscouriers.user.bootstrap.AdminBootstrapService.Outcome;
import com.campuscouriers.user.exception.AdminBootstrapException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminBootstrapRunnerTest {

    @Mock private AdminBootstrapService adminBootstrapService;

    private final AdminBootstrapProperties unset = new AdminBootstrapProperties("", "", "");

    private void run(MockEnvironment environment) {
        new AdminBootstrapRunner(adminBootstrapService, unset, environment).run(new DefaultApplicationArguments());
    }

    @Test
    void run_whenNotConfiguredOnNormalStartup_warnsAndContinues() {
        when(adminBootstrapService.bootstrap()).thenReturn(Outcome.NOT_CONFIGURED);

        assertThatCode(() -> run(new MockEnvironment())).doesNotThrowAnyException();
    }

    @Test
    void run_whenNotConfiguredInBootstrapOnlyMode_fails() {
        when(adminBootstrapService.bootstrap()).thenReturn(Outcome.NOT_CONFIGURED);
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles(AdminBootstrapRunner.BOOTSTRAP_ONLY_PROFILE);

        assertThatThrownBy(() -> run(environment))
                .isInstanceOf(AdminBootstrapException.class)
                .hasMessageContaining("BOOTSTRAP_ADMIN_EMAIL");
    }

    @Test
    void run_whenAdministratorExistsInBootstrapOnlyMode_succeeds() {
        when(adminBootstrapService.bootstrap()).thenReturn(Outcome.ADMIN_EXISTS);
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles(AdminBootstrapRunner.BOOTSTRAP_ONLY_PROFILE);

        assertThatCode(() -> run(environment)).doesNotThrowAnyException();
    }

}
