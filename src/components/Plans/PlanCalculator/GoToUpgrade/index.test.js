import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';
import { MemoryRouter as Router, Route } from 'react-router-dom';
import { GoToUpgrade } from '.';
import { PLAN_TYPE, URL_PLAN_TYPE } from '../../../../doppler-types';
import IntlProvider from '../../../../i18n/DopplerIntlProvider.double-with-ids-as-values';
import { AppServicesProvider } from '../../../../services/pure-di';

const getDependencies = (planData) => {
  return {
    appSessionRef: {
      current: {
        userData: {
          user: {
            plan: planData,
          },
        },
      },
    },
    planService: {
      getPlanTypes: async () => [],
      getPlansByType: async () => [],
    },
  };
};

describe('GoToUpgrade Component', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { assign: jest.fn() },
    });
  });

  it('should go to plan calculator when is a trial account', async () => {
    //Arrange
    const dependencies = getDependencies({
      idPlan: 3,
      isFreeAccount: true,
      planType: PLAN_TYPE.free,
    });

    //Act
    render(
      <IntlProvider>
        <Router initialEntries={[`/plan-selection/premium/${URL_PLAN_TYPE[PLAN_TYPE.byContact]}`]}>
          <Route path="/plan-selection/premium/:planType?">
            <AppServicesProvider forcedServices={dependencies}>
              <GoToUpgrade />
            </AppServicesProvider>
          </Route>
        </Router>
      </IntlProvider>,
    );

    //Assert
    const planCalculatorTitle = await screen.findByText('plan_calculator.plan_premium_title');
    expect(planCalculatorTitle).toBeInTheDocument();
  });

  it('should go to buy credits page when is a credits account', async () => {
    //Arrange
    const dependencies = getDependencies({
      isFreeAccount: false,
      planType: PLAN_TYPE.byCredit,
    });

    //Act
    render(
      <IntlProvider>
        <Router
          initialEntries={[
            `/plan-selection/premium/${
              URL_PLAN_TYPE[PLAN_TYPE.byContact]
            }?PromoCode=S4NV4L3NT1N&origin_inbound=fake`,
          ]}
        >
          <Route path="/plan-selection/premium/:planType?">
            <AppServicesProvider forcedServices={dependencies}>
              <GoToUpgrade />
            </AppServicesProvider>
          </Route>
        </Router>
      </IntlProvider>,
    );

    //Assert
    const planCalculatorTitle = screen.queryByText('plan_calculator.plan_premium_title');
    expect(planCalculatorTitle).not.toBeInTheDocument();

    const loader = screen.getByTestId('loading-box');
    expect(loader).toBeInTheDocument();

    const partialUrl = `/ControlPanel/AccountPreferences/BuyCreditsStep1?PromoCode=S4NV4L3NT1N&origin_inbound=fake`;
    expect(window.location.href).toBe(`${process.env.REACT_APP_DOPPLER_LEGACY_URL}${partialUrl}`);
  });

  describe.each([
    ['should go to upgrade plan when is a contacts account', PLAN_TYPE.byContact],
    ['should go to upgrade plan when is a emails account', PLAN_TYPE.byEmail],
  ])('paid accounts with monthly subscription', (testName, planType) => {
    it(testName, async () => {
      //Arrange
      const dependencies = getDependencies({
        isFreeAccount: false,
        planType: planType,
      });

      //Act
      render(
        <IntlProvider>
          <Router
            initialEntries={[
              `/plan-selection/premium/${
                URL_PLAN_TYPE[PLAN_TYPE.byContact]
              }?PromoCode=S4NV4L3NT1N&origin_inbound=fake`,
            ]}
          >
            <Route path="/plan-selection/premium/:planType?">
              <AppServicesProvider forcedServices={dependencies}>
                <GoToUpgrade />
              </AppServicesProvider>
            </Route>
          </Router>
        </IntlProvider>,
      );

      //Assert
      const planCalculatorTitle = screen.queryByText('plan_calculator.plan_premium_title');
      expect(planCalculatorTitle).not.toBeInTheDocument();

      const loader = screen.getByTestId('loading-box');
      expect(loader).toBeInTheDocument();

      const partialUrl = `/ControlPanel/AccountPreferences/GetAccountInformation?origin_inbound=fake`;
      expect(window.location.href).toBe(`${process.env.REACT_APP_DOPPLER_LEGACY_URL}${partialUrl}`);
    });
  });
});
