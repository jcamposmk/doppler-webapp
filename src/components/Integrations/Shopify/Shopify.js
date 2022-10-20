import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Loading } from '../../Loading/Loading';
import { InjectAppServices } from '../../../services/pure-di';
import { FormattedDate, useIntl } from 'react-intl';
import { SubscriberListState } from '../../../services/shopify-client';
import { StyledShopifyLogo } from './Shopify.styles';
import { FormattedMessageMarkdown } from '../../../i18n/FormattedMessageMarkdown';
import { Breadcrumb, BreadcrumbItem } from '../../shared/Breadcrumb/Breadcrumb';
import useInterval from '../../../hooks/useInterval';
import { UnexpectedError } from '../../shared/UnexpectedError';
import HeaderSection from '../../shared/HeaderSection/HeaderSection';

export const FETCH_SHOPIFY_DATA_INTERVAL = 20000;

const ConnectWithShopify = () => {
  const intl = useIntl();
  const _ = (id, values) => intl.formatMessage({ id: id }, values);

  return (
    <div className="dp-block">
      <h2>{_('shopify.header_title')}</h2>
      <FormattedMessageMarkdown linkTarget={'_blank'} id="shopify.header_subtitle_MD" />
    </div>
  );
};

const LastSyncronization = ({ shopName, lastSyncDate }) => {
  const intl = useIntl();
  const _ = (id, values) => intl.formatMessage({ id: id }, values);

  return (
    <div className="dp-block dp-integration__status">
      <div className="dp-rowflex">
        <div className="col-sm-12 col-md-1 col-lg-1 m-b-24">
          <StyledShopifyLogo />
        </div>
        <div className="col-sm-12 col-md-8 col-lg-8 m-b-24">
          <div className="status__data">
            <ul>
              <li>
                <p>
                  {_('shopify.header_synchronization_date')}{' '}
                  <strong>
                    <FormattedDate value={lastSyncDate} />
                  </strong>
                </p>
                <p>
                  {_('shopify.header_store')} <strong>{shopName}</strong>
                </p>
              </li>
            </ul>
          </div>
        </div>
        <div className="col-sm-12 col-md-3 col-lg-3">
          <div className="status__link dp-align-right">
            <a
              href={_('shopify.admin_apps_url', { shopName })}
              className="dp-button button-medium primary-green"
              rel="noopener noreferrer"
              target="_blank"
            >
              {_('shopify.admin_apps')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const FooterBox = ({ children }) => {
  const intl = useIntl();
  const _ = (id, values) => intl.formatMessage({ id: id }, values);

  return (
    <footer className="dp-integration__actions">
      <a href={_('common.control_panel_url')} className="dp-button button-medium primary-grey">
        {_('common.back')}
      </a>
      {children}
    </footer>
  );
};

const Table = ({ list }) => {
  const intl = useIntl();
  const _ = (id, values) => intl.formatMessage({ id: id }, values);

  return (
    <table className="dp-c-table">
      <thead>
        <tr>
          <th>{_('shopify.table_list')} </th>
          <th> {_('shopify.table_shopify_customers_count')}</th>
        </tr>
      </thead>
      <tbody>
        {list.state === SubscriberListState.ready ? (
          <tr>
            <td>{list.name}</td>
            <td>{list.amountSubscribers}</td>
          </tr>
        ) : (
          <tr className="sync">
            {list.state !== SubscriberListState.notAvailable ? (
              <>
                <td>{list.name}</td>
                <td className="text-sync">
                  <span className="ms-icon icon-clock"></span>
                  {_('common.synchronizing')}
                </td>
              </>
            ) : (
              <td colSpan="2" className="text-sync">
                {_('shopify.no_list_available')}
              </td>
            )}
          </tr>
        )}
      </tbody>
    </table>
  );
};

const Shopify = ({ dependencies: { shopifyClient, dopplerApiClient } }) => {
  const intl = useIntl();
  const _ = (id, values) => intl.formatMessage({ id: id }, values);
  const createInterval = useInterval();
  const [shopifyState, setShopifyState] = useState({
    isLoading: true,
  });
  const shopifyRef = useRef(shopifyState);
  shopifyRef.current = shopifyState;

  useEffect(() => {
    const getShopifyData = async () => {
      const getSubscribersAmountFromAPI = async (listId) => {
        const resultAPI = await dopplerApiClient.getListData(listId);
        return resultAPI.success ? resultAPI.value.amountSubscribers : null;
      };

      const updateSubscriberCount = async (list) => {
        if (list) {
          const subscribersCount = await getSubscribersAmountFromAPI(list.id);
          if (subscribersCount != null) {
            list.amountSubscribers = subscribersCount;
          }
        }
        return list;
      };

      const shopifyResult = await shopifyClient.getShopifyData();
      if (shopifyResult.value && shopifyResult.value.length) {
        //updates only first shop
        shopifyResult.value[0].list = await updateSubscriberCount(shopifyResult.value[0].list);
      }
      return shopifyResult;
    };

    const fetchData = async () => {
      const result = await getShopifyData();
      if (!result.success && !shopifyRef.current.error) {
        setShopifyState({
          error: intl.formatMessage({ id: 'validation_messages.error_unexpected_MD' }),
        });
      } else if (result.value !== shopifyRef.current.shops) {
        setShopifyState({
          shops: result.value,
          isConnected: !!result.value.length,
        });
      }
    };

    fetchData();
    createInterval(fetchData, FETCH_SHOPIFY_DATA_INTERVAL);
  }, [createInterval, shopifyClient, dopplerApiClient, intl]);

  const connect = () => setShopifyState({ isConnecting: true });

  if (shopifyState.isLoading) {
    return <Loading page />;
  }

  return (
    <>
      <Helmet title={_('shopify.title')} />
      <HeaderSection>
        <div className="col-sm-12">
          <Breadcrumb>
            <BreadcrumbItem
              href={_('common.control_panel_advanced_pref_url')}
              text={_('common.control_panel')}
            />
            <BreadcrumbItem text={_('common.advanced_preferences')} />
          </Breadcrumb>
        </div>
      </HeaderSection>
      <section className="dp-container">
        <div className="dp-rowflex">
          <div className="col-sm-12">
            <div className="dp-integration">
              {shopifyState.error ? (
                <>
                  <div className="dp-box-shadow">
                    <ConnectWithShopify />
                    <hr />
                    <FooterBox />
                  </div>
                  <div className="m-t-24 m-b-24">
                    <UnexpectedError msg={shopifyState.error} />
                  </div>
                </>
              ) : shopifyState.isConnected ? (
                shopifyState.shops.map((shop) => (
                  <React.Fragment key={shop.shopName}>
                    <div className="dp-box-shadow">
                      <ConnectWithShopify />
                      <hr />
                      <LastSyncronization
                        shopName={shop.shopName}
                        lastSyncDate={shop.synchronization_date}
                      />
                    </div>
                    <div className="dp-box-shadow m-t-24 m-b-24">
                      <div className="dp-integration__block dp-integration--info">
                        <header className="dp-block">
                          <div>
                            <h2>{_('shopify.list_title')}</h2>
                            <p>{_('shopify.list_subtitle')}</p>
                          </div>
                          {/*<button className="dp-button button--has-icon"><span className="ms-icon icon-reload"></span></button> TODO: enable this button when ready*/}
                        </header>
                        <hr />
                        <div className="dp-block">
                          <ul>
                            <li key={shop.list.id}>
                              <Table list={shop.list} />
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                ))
              ) : (
                <>
                  <div className="dp-box-shadow">
                    <ConnectWithShopify />
                    <hr />
                    <p className="dp-block">{_('shopify.header_disconnected_warning')}</p>
                    <FooterBox>
                      {!shopifyState.isConnecting ? (
                        <a
                          href={_('shopify.connect_url')}
                          className="dp-button button-medium primary-green"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={connect}
                        >
                          {_('common.connect')}
                        </a>
                      ) : (
                        <button
                          disabled
                          className="dp-button button-medium primary-green button--loading"
                        >
                          {_('common.connect')}
                        </button>
                      )}
                    </FooterBox>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default InjectAppServices(Shopify);
