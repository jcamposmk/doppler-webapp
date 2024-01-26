import { FormattedMessage, FormattedNumber } from 'react-intl';
import { amountByPlanType, thousandSeparatorNumber } from '../../../utils';
import {
  CloverError,
  FirstDataError,
  MercadoPagoError,
  OnlySupportUpSelling,
  PLAN_TYPE,
} from '../../../doppler-types';
import { CheckoutLink } from './CheckoutLink';
import { CheckoutButton } from './CheckoutButton';

const numberFormatOptions = {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

const getLegacyCheckoutPurchaseUrl = ({
  controlPanelUrl,
  planId,
  discountId,
  currentQueryParams,
}) => {
  return (
    controlPanelUrl +
    `/AccountPreferences/UpgradeAccountStep2?IdUserTypePlan=${planId}&fromStep1=True` +
    `${discountId ? `&IdDiscountPlan=${discountId}` : ''}` +
    `${currentQueryParams}`
  );
};

const getNewCheckoutPurchaseUrl = ({
  planType,
  planId,
  discountId,
  monthPlan,
  currentQueryParams,
}) => {
  return (
    `/checkout/premium/${planType}?selected-plan=${planId}` +
    `${discountId ? `&discountId=${discountId}` : ''}` +
    `${monthPlan ? `&monthPlan=${monthPlan}` : ''}` +
    `${currentQueryParams}`
  );
};

export const getBuyPurchaseUrl = ({
  controlPanelUrl,
  planType,
  planId,
  discountId,
  monthPlan,
  newCheckoutEnabled,
  search,
}) => {
  const params = new URLSearchParams(search.slice(1));
  // these parameters are eliminated, so that they do not appear repeated in the url
  params.delete('selected-plan');
  params.delete('discountId');
  params.delete('monthPlan');

  const currentQueryParams = params.toString()
    ? `&${params.toString().replace('promo-code', 'PromoCode')}`
    : '';
  return newCheckoutEnabled
    ? getNewCheckoutPurchaseUrl({ planType, planId, discountId, monthPlan, currentQueryParams })
    : getLegacyCheckoutPurchaseUrl({ controlPanelUrl, planId, discountId, currentQueryParams });
};

export const mapItemFromMarketingPlan = ({
  marketingPlan,
  selectedPaymentFrequency,
  amountDetailsData,
  promocodeApplied,
  removePromocodeApplied,
  isTransfer,
  intl,
}) => {
  const numberMonths = selectedPaymentFrequency?.numberMonths;

  console.log('amountDetailsData', amountDetailsData);

  const planInformation = {
    name: <FormattedMessage id={`buy_process.marketing_plan_title`} />,
    featureList: [
      <FormattedMessage
        id={`buy_process.feature_item_${marketingPlan.type}`}
        values={{
          units: thousandSeparatorNumber(intl.defaultLocale, amountByPlanType(marketingPlan)),
          Strong: (chunk) => <strong>{chunk}</strong>,
        }}
      />,
    ],
    data: marketingPlan,
    billingList: [],
  };

  // Months to hire
  if (marketingPlan.type === PLAN_TYPE.byContact) {
    const monthsCount = numberMonths ? numberMonths : 1;
    const amount = numberMonths ? marketingPlan?.fee * monthsCount : marketingPlan?.fee;

    planInformation.featureList.push(
      <>
        <FormattedMessage id={`buy_process.months_to_hire`} />{' '}
        <strong>
          <FormattedMessage
            id="buy_process.month_with_plural"
            values={{ months: monthsCount }}
          ></FormattedMessage>
        </strong>{' '}
        US$ <FormattedNumber value={amount} {...numberFormatOptions} />
      </>,
    );
  }

  // Months to pay
  if (marketingPlan.type === PLAN_TYPE.byContact || marketingPlan.type === PLAN_TYPE.byEmail) {
    const monthsToPay = amountDetailsData?.value?.discountPrepayment?.monthsToPay;
    const monthsCount = monthsToPay ? monthsToPay : numberMonths ? numberMonths : 1;
    const amountMonthsToPay = numberMonths ? marketingPlan?.fee * monthsCount : marketingPlan?.fee;

    planInformation.billingList.push({
      label: (
        <>
          <FormattedMessage
            id={
              marketingPlan.type !== PLAN_TYPE.byContact
                ? `buy_process.months_to_pay`
                : `buy_process.difference_months_to_pay`
            }
            values={{
              months: monthsToPay ? monthsToPay : numberMonths ? numberMonths : 1,
            }}
          />{' '}
          <strong>
            <FormattedMessage
              id="buy_process.month_with_plural"
              values={{ months: monthsCount }}
            ></FormattedMessage>
          </strong>
        </>
      ),
      amount: (
        <>
          US$ <FormattedNumber value={amountMonthsToPay} {...numberFormatOptions} />
        </>
      ),
    });
  }

  // Discount advanced pay
  if (amountDetailsData?.value?.discountPrepayment?.discountPercentage > 0) {
    planInformation.featureList.push(
      <>
        <FormattedMessage
          id={`buy_process.feature_item_discount_advanced_pay`}
          values={{
            months: numberMonths,
          }}
        />
        <span className="dp-discount">
          -{amountDetailsData?.value?.discountPrepayment?.discountPercentage}%
        </span>
      </>,
    );

    planInformation.billingList.push({
      label: (
        <FormattedMessage
          id={`buy_process.shopping_cart.save_percentage`}
          values={{
            percentage: `${amountDetailsData?.value?.discountPrepayment?.discountPercentage}%`,
          }}
        />
      ),
      amount: (
        <>
          US$ -
          <FormattedNumber
            value={amountDetailsData.value.discountPrepayment.amount}
            {...numberFormatOptions}
          />
        </>
      ),
    });
  }

  if (amountDetailsData?.value?.discountPromocode?.discountPercentage > 0) {
    planInformation.featureList.push(
      <>
        <p>
          <FormattedMessage
            id={`buy_process.feature_item_discount_monthly`}
            values={{
              months:
                promocodeApplied?.duration || amountDetailsData?.value?.discountPromocode?.duration,
            }}
          />
        </p>
        {promocodeApplied && (
          <button
            type="button"
            className="dp-btn-delete dpicon iconapp-delete"
            title="borrar"
            onClick={removePromocodeApplied}
          />
        )}
      </>,
    );

    planInformation.billingList.push({
      label: (
        <FormattedMessage
          id={`buy_process.shopping_cart.save_percentage`}
          values={{
            percentage: `${amountDetailsData?.value?.discountPromocode?.discountPercentage}%`,
          }}
        />
      ),
      amount: (
        <>
          US$ -
          <FormattedNumber
            value={amountDetailsData.value.discountPromocode.amount}
            {...numberFormatOptions}
          />
          *
        </>
      ),
    });
  }

  if (amountDetailsData?.value?.discountPlanFeeAdmin?.discountPercentage > 0) {
    planInformation.billingList.push({
      label: (
        <FormattedMessage
          id={`buy_process.promocode.discount_for_admin`}
          values={{
            Strong: (chunk) => <strong>{chunk}</strong>,
            percentage: `${amountDetailsData?.value?.discountPlanFeeAdmin?.discountPercentage}%`,
          }}
        />
      ),
      amount: (
        <>
          US$ -
          <FormattedNumber
            value={amountDetailsData.value.discountPlanFeeAdmin.amount}
            {...numberFormatOptions}
          />
        </>
      ),
    });
  }

  if (promocodeApplied?.planType === PLAN_TYPE.byCredit && promocodeApplied?.extraCredits > 0) {
    planInformation.featureList.push(
      <>
        <p>
          <FormattedMessage
            id={`buy_process.feature_item_extra_credits`}
            values={{
              units: thousandSeparatorNumber(intl.defaultLocale, promocodeApplied?.extraCredits),
            }}
          />
        </p>
        <button
          type="button"
          className="dp-btn-delete dpicon iconapp-delete"
          title="borrar"
          onClick={removePromocodeApplied}
        />
      </>,
    );
  }

  // Positive balance
  if (amountDetailsData?.value?.discountPaymentAlreadyPaid > 0) {
    planInformation.billingList.push({
      label: <FormattedMessage id="buy_process.discount_for_payment_paid" />,
      amount: (
        <>
          US$ -
          <FormattedNumber
            value={amountDetailsData?.value?.discountPaymentAlreadyPaid}
            {...numberFormatOptions}
          />
        </>
      ),
    });
  }

  return planInformation;
};

export const mapItemFromChatPlan = (chatPlan) => ({
  name: <FormattedMessage id={`buy_process.chat_plan_title`} />,
  featureList: [
    <FormattedMessage
      id="buy_process.feature_item_chat_plan"
      values={{
        units: chatPlan.cant,
      }}
    />,
  ],
  billingList: [
    {
      label: 'Ahorra 25%',
      amount: 'US$ 288,00*',
    },
    {
      label: 'Facturación anual',
      amount: 'US$ 216,00*',
    },
  ],
  isRemovible: true,
  data: chatPlan,
  handleRemove: chatPlan.handleRemove,
});

export const getCheckoutErrorMesage = (error) => {
  switch (error) {
    case FirstDataError.invalidExpirationDate:
    case MercadoPagoError.invalidExpirationDate:
    case CloverError.invalidExpirationMonth:
    case CloverError.invalidExpirationYear:
    case CloverError.invalidExpirationCard:
      return 'checkoutProcessForm.payment_method.first_data_error.invalid_expiration_date';
    case FirstDataError.invalidCreditCardNumber:
    case FirstDataError.invalidCCNumber:
    case CloverError.invalidCreditCardNumber:
      return 'checkoutProcessForm.payment_method.first_data_error.invalid_credit_card_number';
    case FirstDataError.declined:
    case FirstDataError.doNotHonorDeclined:
    case MercadoPagoError.declinedOtherReason:
    case CloverError.declined:
      return 'checkoutProcessForm.payment_method.first_data_error.declined';
    case FirstDataError.suspectedFraud:
    case MercadoPagoError.suspectedFraud:
      return 'checkoutProcessForm.payment_method.first_data_error.suspected_fraud';
    case FirstDataError.insufficientFunds:
    case MercadoPagoError.insufficientFunds:
    case CloverError.insufficientFunds:
      return 'checkoutProcessForm.payment_method.first_data_error.insufficient_funds';
    case FirstDataError.cardVolumeExceeded:
      return 'checkoutProcessForm.payment_method.first_data_error.card_volume_exceeded';
    case MercadoPagoError.invalidSecurityCode:
    case CloverError.invalidSecurityCode:
      return 'checkoutProcessForm.payment_method.mercado_pago_error.invalid_security_code';
    case OnlySupportUpSelling:
      return 'checkoutProcessForm.purchase_summary.error_only_supports_upselling_message';
    default:
      return 'checkoutProcessForm.purchase_summary.error_message';
  }
};

export const getBuyButton = ({
  pathname,
  isEqualPlan,
  sessionPlanType,
  selectedMarketingPlan,
  selectedDiscount,
  promotion,
  canBuy,
  paymentMethodName,
  total,
}) => {
  const redirectNewCheckout = [
    PLAN_TYPE.free,
    PLAN_TYPE.byEmail,
    PLAN_TYPE.byContact,
    PLAN_TYPE.byCredit,
  ].includes(sessionPlanType);

  if (pathname.includes('/checkout/premium/')) {
    return (
      <CheckoutButton
        keyTextButton={'buy_process.buy_now_title'}
        canBuy={canBuy}
        planId={selectedMarketingPlan?.id}
        discount={selectedDiscount}
        total={total}
        promotion={promotion}
        paymentMethod={paymentMethodName}
      />
    );
  }

  return (
    <CheckoutLink
      showTooltip={isEqualPlan && sessionPlanType !== PLAN_TYPE.byCredit}
      planType={selectedMarketingPlan?.type}
      planId={selectedMarketingPlan?.id}
      discountId={selectedDiscount?.id}
      promocode={promotion?.promocode ?? ''}
      monthPlan={selectedDiscount?.numberMonths}
      newCheckoutEnabled={redirectNewCheckout}
    />
  );
};
