import React, { useState, useMemo, useEffect } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { useIntl, FormattedMessage } from 'react-intl';
import { Helmet } from 'react-helmet';
import SafeRedirect from '../SafeRedirect';
import { InjectAppServices } from '../../services/pure-di';
import { LoginErrorAccountNotValidated } from './LoginErrorAccountNotValidated';
import { FormattedMessageMarkdown } from '../../i18n/FormattedMessageMarkdown';
import { connect } from 'formik';
import queryString from 'query-string';
import {
  addLogEntry,
  extractParameter,
  isZohoChatOnline,
  openZohoChatWithMessage,
} from '../../utils';
import { Field, Form, FieldArray, Formik } from 'formik';
import {
  EmailFieldItem,
  FieldGroup,
  SubmitButton,
  FormMessages,
} from '../form-helpers/form-helpers';

const fieldNames = {
  user: 'user',
  password: 'password',
};

function extractPageFromRedirect(location) {
  const redirectParameter = extractParameter(location, queryString.parse, 'redirect');
  return /doppleracademy/.exec(redirectParameter) ? 'doppler-academy' : null;
}

/** Extract the page parameter from url*/
function extractPage(location) {
  return (
    extractParameter(location, queryString.parse, 'page', 'Page') ||
    extractPageFromRedirect(location)
  );
}

const extractLegacyRedirectUrl = (location) => {
  const result = /[&?]redirect=(.*)$/.exec(location.search);
  return (result && result.length === 2 && result[1] + location.hash) || null;
};

function getForgotErrorMessage(location) {
  let parsedQuery = location && location.search && queryString.parse(location.search);
  parsedQuery = (parsedQuery && parsedQuery['message']) || null;
  switch (parsedQuery) {
    case 'ExpiredLink':
      return { _warning: 'forgot_password.expired_link' };
    case 'ExpiredData':
      return { _warning: 'forgot_password.expired_data' };
    case 'PassResetOk':
      return { _success: 'forgot_password.pass_reset_ok' };
    case 'BlockedAccount':
      return { _error: <FormattedMessageMarkdown id="forgot_password.blocked_account_MD" /> };
    case 'MaxAttemptsSecQuestion':
      return { _error: 'forgot_password.max_attempts_sec_question' };
    default:
      return null;
  }
}

const isActivactionInProgress = (location) => {
  let params = location && location.search && location.search.replace(/%20/g, '');
  let parsedQuery = queryString.parse(params);
  parsedQuery = (parsedQuery && parsedQuery['activationInProgress']) || null;
  return parsedQuery && parsedQuery === 'true';
};

const LoginErrorBasedOnCustomerSupport = ({ messages }) => {
  return (
    <>
      <p>
        <FormattedMessage id={messages.msgReasonId} />
      </p>
      {isZohoChatOnline() ? (
        <p>
          <FormattedMessage
            id={'validation_messages.error_account_contact_zoho_chat'}
            values={{
              button: (chunk) => (
                <button type="button" onClick={() => openZohoChatWithMessage(messages.msgZohoChat)}>
                  {chunk}
                </button>
              ),
            }}
          />
        </p>
      ) : (
        <FormattedMessageMarkdown id={messages.msgEmailContact} />
      )}
    </>
  );
};

/**
 * Login Page
 * @param { Object } props - props
 * @param { import('react-intl').InjectedIntl } props.intl - intl
 * @param { import('history').Location } props.location - location
 * @param { import('../../services/pure-di').AppServices } props.dependencies
 */
const Login = ({ location, dependencies: { dopplerLegacyClient, sessionManager, window } }) => {
  const intl = useIntl();
  const [redirectAfterLogin, setRedirectAfterLogin] = useState(false);
  const [redirectToUrl, setRedirectToUrl] = useState(false);
  const _ = (id, values) => intl.formatMessage({ id: id }, values);
  const [ initialValues, setInitialValues] = useState([]);
  const [ isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    if (isActivactionInProgress(location) && typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', { send_to: 'AW-1065197040/ZA62CKv_gZEBEPC79vsD' });
    }
  }, [location, window]);

  useEffect(() => {
    const fetchInfo = () => ["juan@gmail.com", "carlos@gmail.com"];
    setIsLoading(true);
    setTimeout(() => {
      const data = fetchInfo();
      setInitialValues([...data, ""]);
      setIsLoading(false);
    }, 2000);
  }, []);

  const errorMessages = {
    blockedAccountNotPayed: {
      msgReasonId: 'validation_messages.error_account_is_blocked_not_pay',
      msgZohoChat: _('validation_messages.error_account_is_blocked_not_pay_zoho_chat_msg'),
      msgEmailContact: 'validation_messages.error_account_is_blocked_not_pay_contact_support_MD',
    },
    cancelatedAccountNotPayed: {
      msgReasonId: 'validation_messages.error_account_is_canceled_not_pay',
      msgZohoChat: _('validation_messages.error_account_is_canceled_not_pay_zoho_chat_msg'),
      msgEmailContact: 'validation_messages.error_account_is_canceled_not_pay_contact_support_MD',
    },
    cancelatedAccount: {
      msgReasonId: 'validation_messages.error_account_is_canceled_other_reason',
      msgZohoChat: _('validation_messages.error_account_is_canceled_other_reason_zoho_chat_msg'),
      msgEmailContact:
        'validation_messages.error_account_is_canceled_other_reason_contact_support_MD',
    },
    blockedAccountInvalidPassword: {
      msgReasonId: 'validation_messages.error_account_is_blocked_invalid_password',
      msgZohoChat: _('validation_messages.error_account_is_blocked_invalid_password_zoho_chat_msg'),
      msgEmailContact:
        'validation_messages.error_account_is_blocked_invalid_password_contact_support_MD',
    },
  };

  if (redirectToUrl) {
    return <SafeRedirect to={redirectToUrl} />;
  }

  if (redirectAfterLogin) {
    const legacyRedirectUrl = extractLegacyRedirectUrl(location);
    return legacyRedirectUrl ? (
      <SafeRedirect to={legacyRedirectUrl} />
    ) : (
      <Redirect to={(location.state && location.state.from) || { pathname: '/' }} />
    );
  }

  const handleKeyDown = (event, callback) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      callback();
    }
  }

  const validateEmail = (value) => {
    let error;
    if (!value) {
      error = 'Required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)) {
      error = 'Invalid email address';
    }
    return error;
  }

  const addEmail = async (validateField, fieldName, callback) => {
    const errors = await validateField(fieldName);
    if(!errors && callback) {
      callback();
    }
  }

  const validateForm = ({emails}) => {
    const errors = {};
    const emailsAdded = emails.filter(f => f);
    if (!emailsAdded || emailsAdded.length === 0) {
      errors.emails = 'Required';
    }
  
    return errors;
  }

  return (
    <div className="dp-app-container">
      <main 
        className="panel-wrapper p-l-54 p-t-54">
        <Helmet>
          <title>{_('login.head_title')}</title>
          <meta name="description" content={_('login.head_description')} />
        </Helmet>
        <Formik
          validate={validateForm}
          enableReinitialize={true}
          validateOnChange={false}
          validateOnBlur={false}
          initialValues={{ emails: initialValues }}
          onSubmit={values =>
            setTimeout(() => {
              alert(JSON.stringify(values.emails.filter(f => f), null, 2));

            }, 500)
          }
          render={({ values, errors, touched, validateField }) => (
            <Form>
              <FieldArray
                name="emails"
                render={arrayHelpers => {
                  const fieldName = `emails.${Math.max(0, values.emails.length-1)}`;
                  const _addEmail = () => addEmail(validateField, fieldName, () => arrayHelpers.push(''));
                  const isEmailEmpty = !values.emails[Math.max(0, values.emails.length-1)];

                  return (
                    <div>
                      <div className="dp-rowflex p-b-32">
                        <div class="col-md-7">
                          <Field 
                            name={fieldName}
                            onKeyDown={!isEmailEmpty ? e => handleKeyDown(e, _addEmail) : null}
                            validate={!isEmailEmpty ? validateEmail : null} />
                        </div>
                          <button 
                              disabled={isEmailEmpty}
                              type="button" 
                              onClick={_addEmail}
                              className="dp-button button-medium secondary-green">
                              Agregar
                            </button>
                      </div>
                      { errors.emails && <div className="dp-error">{errors.emails}</div> } 
                      {
                        isLoading ? (
                          <span>Cargando ...</span>
                        ) : (
                            values.emails?.length > 1 && (
                              values.emails.slice(0, values.emails.length-1).map((friend, index) => (
                                <div key={index} className="p-b-6 p-t-6">
                                  <span className="p-r-36">{friend}</span>
                                  <button
                                    type="button"
                                    onClick={() => arrayHelpers.remove(index)} // remove a friend from the list
                                  >
                                    Quitar
                                  </button>
                                </div>
                              ))
                          )
                        )
                      }
                      <div className="p-t-54 p-l-54 m-l-54">
                        <button 
                          type="submit"
                          className="dp-button button-medium primary-green">
                          Guardar
                      </button>
                    </div>
                  </div>
                )}}
              />
            </Form>
          )}
        />
      </main>
    </div>
  );
};

export default InjectAppServices(Login);
