import { useIntl, FormattedMessage } from 'react-intl';

export const DefaultConfirmationContent = ({
  incrementAndResend,
  registeredUser,
  resentTimes,
  mailtoSupport,
  Captcha,
}) => {
  const intl = useIntl();
  const _ = (id, values) => intl.formatMessage({ id: id }, values);

  return (
    <>
      <h1>{_('signup.check_your_email')}</h1>
      <p>
        {_('signup.check_email')}
        <strong>{registeredUser}</strong>
        {_('signup.check_email_2')}
      </p>
      <p>
        <FormattedMessage
          id={'signup.access_new_account'}
          values={{
            strong: (chunks) => <strong>{chunks}</strong>,
          }}
        />
      </p>
      <div className="dp-divisor-line">
        <span className="dp-line"></span>
      </div>
      {resentTimes === 0 ? (
        <>
          <Captcha />
          <p>
            {_('signup.if_didnt_receive_email')}
            <button type="button" className="dp-button link-green" onClick={incrementAndResend}>
              <FormattedMessage
                id={'signup.resend_email'}
                values={{
                  underline: (chunks) => <u>{chunks}</u>,
                }}
              />
            </button>
          </p>
        </>
      ) : (
        <div data-testid="warning-message" className="dp-wrap-message dp-wrap-warning">
          <span className="dp-message-icon"></span>
          <div className="dp-content-message">
            <p>
              {intl.formatMessage({ id: 'signup.no_more_resend_MD' }) + ' '}
              <a href={mailtoSupport} className="dp-message-link">
                {intl.formatMessage({ id: 'signup.no_more_resend_MD_link' })}
              </a>
            </p>
          </div>
        </div>
      )}
      <div className="dp-icons-content">
        <div className="dp-icons-divisor">
          <span className="dp-rectangle--violet"></span>{' '}
          <span className="dp-rectangle--orange"></span>
        </div>
      </div>
      <p className="dp-text--italic">
        <FormattedMessage
          id={'signup.have_doubts'}
          values={{
            a: (chunks) => (
              <a
                href={`https://www.fromdoppler.com/${intl.locale}/contact/?utm_source=direct`}
                rel="noopener"
                target="_blank"
              >
                {chunks}
              </a>
            ),
          }}
        />
      </p>
    </>
  );
};
