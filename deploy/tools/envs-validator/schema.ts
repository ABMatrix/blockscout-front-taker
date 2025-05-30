declare module 'yup' {
  interface StringSchema {
    // Yup's URL validator is not perfect so we made our own
    // https://github.com/jquense/yup/pull/1859
    url(): never;
  }
}

import * as yup from 'yup';

import type { AdButlerConfig } from '../../../types/client/adButlerConfig';
import { SUPPORTED_AD_TEXT_PROVIDERS, SUPPORTED_AD_BANNER_PROVIDERS, SUPPORTED_AD_BANNER_ADDITIONAL_PROVIDERS } from '../../../types/client/adProviders';
import type { AdTextProviders, AdBannerProviders, AdBannerAdditionalProviders } from '../../../types/client/adProviders';
import type { ContractCodeIde } from '../../../types/client/contract';
import type { DeFiDropdownItem } from '../../../types/client/deFiDropdown';
import { GAS_UNITS } from '../../../types/client/gasTracker';
import type { GasUnit } from '../../../types/client/gasTracker';
import type { MarketplaceAppOverview, MarketplaceAppSecurityReportRaw, MarketplaceAppSecurityReport } from '../../../types/client/marketplace';
import type { MultichainProviderConfig } from '../../../types/client/multichainProviderConfig';
import { NAVIGATION_LINK_IDS } from '../../../types/client/navigation-items';
import type { NavItemExternal, NavigationLinkId } from '../../../types/client/navigation-items';
import { ROLLUP_TYPES } from '../../../types/client/rollup';
import type { BridgedTokenChain, TokenBridge } from '../../../types/client/token';
import { PROVIDERS as TX_INTERPRETATION_PROVIDERS } from '../../../types/client/txInterpretation';
import { VALIDATORS_CHAIN_TYPE } from '../../../types/client/validators';
import type { ValidatorsChainType } from '../../../types/client/validators';
import type { WalletType } from '../../../types/client/wallets';
import { SUPPORTED_WALLETS } from '../../../types/client/wallets';
import type { CustomLink, CustomLinksGroup } from '../../../types/footerLinks';
import { CHAIN_INDICATOR_IDS } from '../../../types/homepage';
import type { ChainIndicatorId } from '../../../types/homepage';
import { type NetworkVerificationType, type NetworkExplorer, type FeaturedNetwork, NETWORK_GROUPS } from '../../../types/networks';
import { COLOR_THEME_IDS } from '../../../types/settings';
import type { AddressViewId } from '../../../types/views/address';
import { ADDRESS_VIEWS_IDS, IDENTICON_TYPES } from '../../../types/views/address';
import { BLOCK_FIELDS_IDS } from '../../../types/views/block';
import type { BlockFieldId } from '../../../types/views/block';
import type { NftMarketplaceItem } from '../../../types/views/nft';
import type { TxAdditionalFieldsId, TxFieldsId } from '../../../types/views/tx';
import { TX_ADDITIONAL_FIELDS_IDS, TX_FIELDS_IDS } from '../../../types/views/tx';

import { replaceQuotes } from '../../../configs/app/utils';
import * as regexp from '../../../lib/regexp';
import type { IconName } from '../../../ui/shared/IconSvg';

const protocols = [ 'http', 'https' ];

const urlTest: yup.TestConfig = {
  name: 'url',
  test: (value: unknown) => {
    if (!value) {
      return true;
    }

    try {
      if (typeof value === 'string') {
        new URL(value);
        return true;
      }
    } catch (error) {}

    return false;
  },
  message: '${path} is not a valid URL',
  exclusive: true,
};

const marketplaceAppSchema: yup.ObjectSchema<MarketplaceAppOverview> = yup
  .object({
    id: yup.string().required(),
    external: yup.boolean(),
    title: yup.string().required(),
    logo: yup.string().test(urlTest).required(),
    logoDarkMode: yup.string().test(urlTest),
    shortDescription: yup.string().required(),
    categories: yup.array().of(yup.string().required()).required(),
    url: yup.string().test(urlTest).required(),
    author: yup.string().required(),
    description: yup.string().required(),
    site: yup.string().test(urlTest),
    twitter: yup.string().test(urlTest),
    telegram: yup.string().test(urlTest),
    github: yup.lazy(value =>
      Array.isArray(value) ?
        yup.array().of(yup.string().required().test(urlTest)) :
        yup.string().test(urlTest),
    ),
    discord: yup.string().test(urlTest),
    internalWallet: yup.boolean(),
    priority: yup.number(),
  });

const issueSeverityDistributionSchema: yup.ObjectSchema<MarketplaceAppSecurityReport['overallInfo']['issueSeverityDistribution']> = yup
  .object({
    critical: yup.number().required(),
    gas: yup.number().required(),
    high: yup.number().required(),
    informational: yup.number().required(),
    low: yup.number().required(),
    medium: yup.number().required(),
  });

const solidityscanReportSchema: yup.ObjectSchema<MarketplaceAppSecurityReport['contractsData'][number]['solidityScanReport']> = yup
  .object({
    contractname: yup.string().required(),
    scan_status: yup.string().required(),
    scan_summary: yup
      .object({
        issue_severity_distribution: issueSeverityDistributionSchema.required(),
        lines_analyzed_count: yup.number().required(),
        scan_time_taken: yup.number().required(),
        score: yup.string().required(),
        score_v2: yup.string().required(),
        threat_score: yup.string().required(),
      })
      .required(),
    scanner_reference_url: yup.string().test(urlTest).required(),
  });

const contractDataSchema: yup.ObjectSchema<MarketplaceAppSecurityReport['contractsData'][number]> = yup
  .object({
    address: yup.string().required(),
    isVerified: yup.boolean().required(),
    solidityScanReport: solidityscanReportSchema.nullable().notRequired(),
  });

const chainsDataSchema = yup.lazy((objValue) => {
  let schema = yup.object();
  Object.keys(objValue).forEach((key) => {
    schema = schema.shape({
      [key]: yup.object({
        overallInfo: yup.object({
          verifiedNumber: yup.number().required(),
          totalContractsNumber: yup.number().required(),
          solidityScanContractsNumber: yup.number().required(),
          securityScore: yup.number().required(),
          issueSeverityDistribution: issueSeverityDistributionSchema.required(),
        }).required(),
        contractsData: yup.array().of(contractDataSchema).required(),
      }),
    });
  });
  return schema;
});

const securityReportSchema: yup.ObjectSchema<MarketplaceAppSecurityReportRaw> = yup
  .object({
    appName: yup.string().required(),
    chainsData: chainsDataSchema,
  });

const marketplaceSchema = yup
  .object()
  .shape({
    NEXT_PUBLIC_MARKETPLACE_ENABLED: yup.boolean(),
    NEXT_PUBLIC_MARKETPLACE_CONFIG_URL: yup
      .array()
      .json()
      .of(marketplaceAppSchema)
      .when('NEXT_PUBLIC_MARKETPLACE_ENABLED', {
        is: true,
        then: (schema) => schema,
        // eslint-disable-next-line max-len
        otherwise: (schema) => schema.max(-1, 'NEXT_PUBLIC_MARKETPLACE_CONFIG_URL cannot not be used without NEXT_PUBLIC_MARKETPLACE_ENABLED'),
      }),
    NEXT_PUBLIC_MARKETPLACE_CATEGORIES_URL: yup
      .array()
      .json()
      .of(yup.string())
      .when('NEXT_PUBLIC_MARKETPLACE_ENABLED', {
        is: true,
        then: (schema) => schema,
        // eslint-disable-next-line max-len
        otherwise: (schema) => schema.max(-1, 'NEXT_PUBLIC_MARKETPLACE_CATEGORIES_URL cannot not be used without NEXT_PUBLIC_MARKETPLACE_ENABLED'),
      }),
    NEXT_PUBLIC_MARKETPLACE_SUBMIT_FORM: yup
      .string()
      .when('NEXT_PUBLIC_MARKETPLACE_ENABLED', {
        is: true,
        then: (schema) => schema.test(urlTest).required(),
        // eslint-disable-next-line max-len
        otherwise: (schema) => schema.max(-1, 'NEXT_PUBLIC_MARKETPLACE_SUBMIT_FORM cannot not be used without NEXT_PUBLIC_MARKETPLACE_ENABLED'),
      }),
    NEXT_PUBLIC_MARKETPLACE_SUGGEST_IDEAS_FORM: yup
      .string()
      .when('NEXT_PUBLIC_MARKETPLACE_ENABLED', {
        is: true,
        then: (schema) => schema.test(urlTest),
        // eslint-disable-next-line max-len
        otherwise: (schema) => schema.max(-1, 'NEXT_PUBLIC_MARKETPLACE_SUGGEST_IDEAS_FORM cannot not be used without NEXT_PUBLIC_MARKETPLACE_ENABLED'),
      }),
    NEXT_PUBLIC_MARKETPLACE_SECURITY_REPORTS_URL: yup
      .array()
      .json()
      .of(securityReportSchema)
      .when('NEXT_PUBLIC_MARKETPLACE_ENABLED', {
        is: true,
        then: (schema) => schema,
        // eslint-disable-next-line max-len
        otherwise: (schema) => schema.max(-1, 'NEXT_PUBLIC_MARKETPLACE_SECURITY_REPORTS_URL cannot not be used without NEXT_PUBLIC_MARKETPLACE_ENABLED'),
      }),
    NEXT_PUBLIC_MARKETPLACE_FEATURED_APP: yup
      .string()
      .when('NEXT_PUBLIC_MARKETPLACE_ENABLED', {
        is: true,
        then: (schema) => schema,
        // eslint-disable-next-line max-len
        otherwise: (schema) => schema.max(-1, 'NEXT_PUBLIC_MARKETPLACE_FEATURED_APP cannot not be used without NEXT_PUBLIC_MARKETPLACE_ENABLED'),
      }),
    NEXT_PUBLIC_MARKETPLACE_BANNER_CONTENT_URL: yup
      .string()
      .when('NEXT_PUBLIC_MARKETPLACE_ENABLED', {
        is: true,
        then: (schema) => schema.test(urlTest),
        // eslint-disable-next-line max-len
        otherwise: (schema) => schema.max(-1, 'NEXT_PUBLIC_MARKETPLACE_BANNER_CONTENT_URL cannot not be used without NEXT_PUBLIC_MARKETPLACE_ENABLED'),
      }),
    NEXT_PUBLIC_MARKETPLACE_BANNER_LINK_URL: yup
      .string()
      .when('NEXT_PUBLIC_MARKETPLACE_ENABLED', {
        is: true,
        then: (schema) => schema.test(urlTest),
        // eslint-disable-next-line max-len
        otherwise: (schema) => schema.max(-1, 'NEXT_PUBLIC_MARKETPLACE_BANNER_LINK_URL cannot not be used without NEXT_PUBLIC_MARKETPLACE_ENABLED'),
      }),
  });

const beaconChainSchema = yup
  .object()
  .shape({
    NEXT_PUBLIC_HAS_BEACON_CHAIN: yup.boolean(),
    NEXT_PUBLIC_BEACON_CHAIN_CURRENCY_SYMBOL: yup
      .string()
      .when('NEXT_PUBLIC_HAS_BEACON_CHAIN', {
        is: (value: boolean) => value,
        then: (schema) => schema.min(1).optional(),
        otherwise: (schema) => schema.max(
          -1,
          'NEXT_PUBLIC_BEACON_CHAIN_CURRENCY_SYMBOL cannot not be used if NEXT_PUBLIC_HAS_BEACON_CHAIN is not set to "true"',
        ),
      }),
  });

const rollupSchema = yup
  .object()
  .shape({
    NEXT_PUBLIC_ROLLUP_TYPE: yup.string().oneOf(ROLLUP_TYPES),
    NEXT_PUBLIC_ROLLUP_L1_BASE_URL: yup
      .string()
      .when('NEXT_PUBLIC_ROLLUP_TYPE', {
        is: (value: string) => value,
        then: (schema) => schema.test(urlTest).required(),
        otherwise: (schema) => schema.max(-1, 'NEXT_PUBLIC_ROLLUP_L1_BASE_URL cannot not be used if NEXT_PUBLIC_ROLLUP_TYPE is not defined'),
      }),
    NEXT_PUBLIC_ROLLUP_L2_WITHDRAWAL_URL: yup
      .string()
      .when('NEXT_PUBLIC_ROLLUP_TYPE', {
        is: (value: string) => value === 'optimistic',
        then: (schema) => schema.test(urlTest).required(),
        otherwise: (schema) => schema.max(-1, 'NEXT_PUBLIC_ROLLUP_L2_WITHDRAWAL_URL cannot not be used if NEXT_PUBLIC_ROLLUP_TYPE is not defined'),
      }),
  });

const adButlerConfigSchema = yup
  .object<AdButlerConfig>()
  .transform(replaceQuotes)
  .json()
  .when('NEXT_PUBLIC_AD_BANNER_PROVIDER', {
    is: (value: AdBannerProviders) => value === 'adbutler',
    then: (schema) => schema
      .shape({
        id: yup.string().required(),
        width: yup.number().positive().required(),
        height: yup.number().positive().required(),
      })
      .required(),
  })
  .when('NEXT_PUBLIC_AD_BANNER_ADDITIONAL_PROVIDER', {
    is: (value: AdBannerProviders) => value === 'adbutler',
    then: (schema) => schema
      .shape({
        id: yup.string().required(),
        width: yup.number().positive().required(),
        height: yup.number().positive().required(),
      })
      .required(),
  });

const adsBannerSchema = yup
  .object()
  .shape({
    NEXT_PUBLIC_AD_BANNER_PROVIDER: yup.string<AdBannerProviders>().oneOf(SUPPORTED_AD_BANNER_PROVIDERS),
    NEXT_PUBLIC_AD_BANNER_ADDITIONAL_PROVIDER: yup.string<AdBannerAdditionalProviders>().oneOf(SUPPORTED_AD_BANNER_ADDITIONAL_PROVIDERS),
    NEXT_PUBLIC_AD_ADBUTLER_CONFIG_DESKTOP: adButlerConfigSchema,
    NEXT_PUBLIC_AD_ADBUTLER_CONFIG_MOBILE: adButlerConfigSchema,
  });

const sentrySchema = yup
  .object()
  .shape({
    NEXT_PUBLIC_SENTRY_DSN: yup.string().test(urlTest),
    SENTRY_CSP_REPORT_URI: yup
      .string()
      .when('NEXT_PUBLIC_SENTRY_DSN', {
        is: (value: string) => Boolean(value),
        then: (schema) => schema.test(urlTest),
        otherwise: (schema) => schema.max(-1, 'SENTRY_CSP_REPORT_URI cannot not be used without NEXT_PUBLIC_SENTRY_DSN'),
      }),
    NEXT_PUBLIC_SENTRY_ENABLE_TRACING: yup
      .boolean()
      .when('NEXT_PUBLIC_SENTRY_DSN', {
        is: (value: string) => Boolean(value),
        then: (schema) => schema,
      }),
    NEXT_PUBLIC_APP_INSTANCE: yup
      .string()
      .when('NEXT_PUBLIC_SENTRY_DSN', {
        is: (value: string) => Boolean(value),
        then: (schema) => schema,
        otherwise: (schema) => schema.max(-1, 'NEXT_PUBLIC_APP_INSTANCE cannot not be used without NEXT_PUBLIC_SENTRY_DSN'),
      }),
    NEXT_PUBLIC_APP_ENV: yup
      .string()
      .when('NEXT_PUBLIC_SENTRY_DSN', {
        is: (value: string) => Boolean(value),
        then: (schema) => schema,
        otherwise: (schema) => schema.max(-1, 'NEXT_PUBLIC_APP_ENV cannot not be used without NEXT_PUBLIC_SENTRY_DSN'),
      }),
  });

const accountSchema = yup
  .object()
  .shape({
    NEXT_PUBLIC_IS_ACCOUNT_SUPPORTED: yup.boolean(),
    NEXT_PUBLIC_AUTH0_CLIENT_ID: yup
      .string()
      .when('NEXT_PUBLIC_IS_ACCOUNT_SUPPORTED', {
        is: (value: boolean) => value,
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.max(-1, 'NEXT_PUBLIC_AUTH0_CLIENT_ID cannot not be used if NEXT_PUBLIC_IS_ACCOUNT_SUPPORTED is not set to "true"'),
      }),
    NEXT_PUBLIC_AUTH_URL: yup
      .string()
      .when('NEXT_PUBLIC_IS_ACCOUNT_SUPPORTED', {
        is: (value: boolean) => value,
        then: (schema) => schema.test(urlTest),
        otherwise: (schema) => schema.max(-1, 'NEXT_PUBLIC_AUTH_URL cannot not be used if NEXT_PUBLIC_IS_ACCOUNT_SUPPORTED is not set to "true"'),
      }),
    NEXT_PUBLIC_LOGOUT_URL: yup
      .string()
      .when('NEXT_PUBLIC_IS_ACCOUNT_SUPPORTED', {
        is: (value: boolean) => value,
        then: (schema) => schema.test(urlTest).required(),
        otherwise: (schema) => schema.max(-1, 'NEXT_PUBLIC_LOGOUT_URL cannot not be used if NEXT_PUBLIC_IS_ACCOUNT_SUPPORTED is not set to "true"'),
      }),
  });

const featuredNetworkSchema: yup.ObjectSchema<FeaturedNetwork> = yup
  .object()
  .shape({
    title: yup.string().required(),
    url: yup.string().test(urlTest).required(),
    group: yup.string().oneOf(NETWORK_GROUPS).required(),
    icon: yup.string().test(urlTest),
    isActive: yup.boolean(),
    invertIconInDarkMode: yup.boolean(),
  });

const navItemExternalSchema: yup.ObjectSchema<NavItemExternal> = yup
  .object({
    text: yup.string().required(),
    url: yup.string().test(urlTest).required(),
  });

const footerLinkSchema: yup.ObjectSchema<CustomLink> = yup
  .object({
    text: yup.string().required(),
    url: yup.string().test(urlTest).required(),
  });

const footerLinkGroupSchema: yup.ObjectSchema<CustomLinksGroup> = yup
  .object({
    title: yup.string().required(),
    links: yup
      .array()
      .of(footerLinkSchema)
      .required(),
  });

const networkExplorerSchema: yup.ObjectSchema<NetworkExplorer> = yup
  .object({
    title: yup.string().required(),
    logo: yup.string().test(urlTest),
    baseUrl: yup.string().test(urlTest).required(),
    paths: yup
      .object()
      .shape({
        tx: yup.string(),
        address: yup.string(),
        token: yup.string(),
        block: yup.string(),
      }),
  });

const contractCodeIdeSchema: yup.ObjectSchema<ContractCodeIde> = yup
  .object({
    title: yup.string().required(),
    url: yup.string().test(urlTest).required(),
    icon_url: yup.string().test(urlTest).required(),
  });

const nftMarketplaceSchema: yup.ObjectSchema<NftMarketplaceItem> = yup
  .object({
    name: yup.string().required(),
    collection_url: yup.string().test(urlTest).required(),
    instance_url: yup.string().test(urlTest).required(),
    logo_url: yup.string().test(urlTest).required(),
  });

const bridgedTokenChainSchema: yup.ObjectSchema<BridgedTokenChain> = yup
  .object({
    id: yup.string().required(),
    title: yup.string().required(),
    short_title: yup.string().required(),
    base_url: yup.string().test(urlTest).required(),
  });

const tokenBridgeSchema: yup.ObjectSchema<TokenBridge> = yup
  .object({
    type: yup.string().required(),
    title: yup.string().required(),
    short_title: yup.string().required(),
  });

const bridgedTokensSchema = yup
  .object()
  .shape({
    NEXT_PUBLIC_BRIDGED_TOKENS_CHAINS: yup
      .array()
      .transform(replaceQuotes)
      .json()
      .of(bridgedTokenChainSchema),
    NEXT_PUBLIC_BRIDGED_TOKENS_BRIDGES: yup
      .array()
      .transform(replaceQuotes)
      .json()
      .of(tokenBridgeSchema)
      .when('NEXT_PUBLIC_BRIDGED_TOKENS_CHAINS', {
        is: (value: Array<unknown>) => value && value.length > 0,
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.max(-1, 'NEXT_PUBLIC_BRIDGED_TOKENS_BRIDGES cannot not be used without NEXT_PUBLIC_BRIDGED_TOKENS_CHAINS'),
      }),
  });

const deFiDropdownItemSchema: yup.ObjectSchema<DeFiDropdownItem> = yup
  .object({
    text: yup.string().required(),
    icon: yup.string<IconName>().required(),
    dappId: yup.string(),
    url: yup.string().test(urlTest),
  })
  .test('oneOfRequired', 'NEXT_PUBLIC_DEFI_DROPDOWN_ITEMS: Either dappId or url is required', function(value) {
    return Boolean(value.dappId) || Boolean(value.url);
  }) as yup.ObjectSchema<DeFiDropdownItem>;

const schema = yup
  .object()
  .noUnknown(true, (params) => {
    return `Unknown ENV variables were provided: ${ params.unknown }`;
  })
  .shape({
    // I. Build-time ENVs
    // -----------------
    NEXT_PUBLIC_GIT_TAG: yup.string(),
    NEXT_PUBLIC_GIT_COMMIT_SHA: yup.string(),

    // II. Run-time ENVs
    // -----------------
    // 1. App configuration
    NEXT_PUBLIC_APP_HOST: yup.string().required(),
    NEXT_PUBLIC_APP_PROTOCOL: yup.string().oneOf(protocols),
    NEXT_PUBLIC_APP_PORT: yup.number().positive().integer(),

    // 2. Blockchain parameters
    NEXT_PUBLIC_NETWORK_NAME: yup.string().required(),
    NEXT_PUBLIC_NETWORK_SHORT_NAME: yup.string(),
    NEXT_PUBLIC_NETWORK_ID: yup.number().positive().integer().required(),
    NEXT_PUBLIC_NETWORK_RPC_URL: yup.string().test(urlTest),
    NEXT_PUBLIC_NETWORK_CURRENCY_NAME: yup.string(),
    NEXT_PUBLIC_NETWORK_CURRENCY_WEI_NAME: yup.string(),
    NEXT_PUBLIC_NETWORK_CURRENCY_SYMBOL: yup.string(),
    NEXT_PUBLIC_NETWORK_CURRENCY_DECIMALS: yup.number().integer().positive(),
    NEXT_PUBLIC_NETWORK_SECONDARY_COIN_SYMBOL: yup.string(),
    NEXT_PUBLIC_NETWORK_VERIFICATION_TYPE: yup.string<NetworkVerificationType>().oneOf([ 'validation', 'mining' ]),
    NEXT_PUBLIC_NETWORK_TOKEN_STANDARD_NAME: yup.string(),
    NEXT_PUBLIC_IS_TESTNET: yup.boolean(),
    NEXT_PUBLIC_NETWORK_CURRENCY_IMAGE_URL: yup.string(),
    NEXT_PUBLIC_TOTAL_TITLE: yup.string(),
    // 3. API configuration
    NEXT_PUBLIC_API_PROTOCOL: yup.string().oneOf(protocols),
    NEXT_PUBLIC_API_HOST: yup.string().required(),
    NEXT_PUBLIC_API_PORT: yup.number().integer().positive(),
    NEXT_PUBLIC_API_BASE_PATH: yup.string(),
    NEXT_PUBLIC_API_WEBSOCKET_PROTOCOL: yup.string().oneOf([ 'ws', 'wss' ]),

    // 4. UI configuration
    //   a. homepage
    NEXT_PUBLIC_HOMEPAGE_CHARTS: yup
      .array()
      .transform(replaceQuotes)
      .json()
      .of(yup.string<ChainIndicatorId>().oneOf(CHAIN_INDICATOR_IDS)),
    NEXT_PUBLIC_HOMEPAGE_PLATE_TEXT_COLOR: yup.string(),
    NEXT_PUBLIC_HOMEPAGE_PLATE_BACKGROUND: yup.string(),
    NEXT_PUBLIC_HOMEPAGE_SHOW_AVG_BLOCK_TIME: yup.boolean(),

    //     b. sidebar
    NEXT_PUBLIC_FEATURED_NETWORKS: yup
      .array()
      .json()
      .of(featuredNetworkSchema),
    NEXT_PUBLIC_OTHER_LINKS: yup
      .array()
      .transform(replaceQuotes)
      .json()
      .of(navItemExternalSchema),
    NEXT_PUBLIC_NAVIGATION_HIDDEN_LINKS: yup
      .array()
      .transform(replaceQuotes)
      .json()
      .of(yup.string<NavigationLinkId>().oneOf(NAVIGATION_LINK_IDS)),
    NEXT_PUBLIC_NAVIGATION_HIGHLIGHTED_ROUTES: yup
      .array()
      .transform(replaceQuotes)
      .json()
      .of(yup.string()),
    NEXT_PUBLIC_NETWORK_LOGO: yup.string().test(urlTest),
    NEXT_PUBLIC_NETWORK_LOGO_DARK: yup.string().test(urlTest),
    NEXT_PUBLIC_NETWORK_ICON: yup.string().test(urlTest),
    NEXT_PUBLIC_NETWORK_ICON_DARK: yup.string().test(urlTest),

    //     c. footer
    NEXT_PUBLIC_FOOTER_LINKS: yup
      .array()
      .json()
      .of(footerLinkGroupSchema),

    //     d. views
    NEXT_PUBLIC_VIEWS_BLOCK_HIDDEN_FIELDS: yup
      .array()
      .transform(replaceQuotes)
      .json()
      .of(yup.string<BlockFieldId>().oneOf(BLOCK_FIELDS_IDS)),
    NEXT_PUBLIC_VIEWS_ADDRESS_IDENTICON_TYPE: yup.string().oneOf(IDENTICON_TYPES),
    NEXT_PUBLIC_VIEWS_ADDRESS_HIDDEN_VIEWS: yup
      .array()
      .transform(replaceQuotes)
      .json()
      .of(yup.string<AddressViewId>().oneOf(ADDRESS_VIEWS_IDS)),
    NEXT_PUBLIC_VIEWS_CONTRACT_SOLIDITYSCAN_ENABLED: yup.boolean(),
    NEXT_PUBLIC_VIEWS_TX_HIDDEN_FIELDS: yup
      .array()
      .transform(replaceQuotes)
      .json()
      .of(yup.string<TxFieldsId>().oneOf(TX_FIELDS_IDS)),
    NEXT_PUBLIC_VIEWS_TX_ADDITIONAL_FIELDS: yup
      .array()
      .transform(replaceQuotes)
      .json()
      .of(yup.string<TxAdditionalFieldsId>().oneOf(TX_ADDITIONAL_FIELDS_IDS)),
    NEXT_PUBLIC_VIEWS_NFT_MARKETPLACES: yup
      .array()
      .transform(replaceQuotes)
      .json()
      .of(nftMarketplaceSchema),

    //     e. misc
    NEXT_PUBLIC_NETWORK_EXPLORERS: yup
      .array()
      .transform(replaceQuotes)
      .json()
      .of(networkExplorerSchema),
    NEXT_PUBLIC_CONTRACT_CODE_IDES: yup
      .array()
      .transform(replaceQuotes)
      .json()
      .of(contractCodeIdeSchema),
    NEXT_PUBLIC_HAS_CONTRACT_AUDIT_REPORTS: yup.boolean(),
    NEXT_PUBLIC_HIDE_INDEXING_ALERT_BLOCKS: yup.boolean(),
    NEXT_PUBLIC_HIDE_INDEXING_ALERT_INT_TXS: yup.boolean(),
    NEXT_PUBLIC_MAINTENANCE_ALERT_MESSAGE: yup.string(),
    NEXT_PUBLIC_COLOR_THEME_DEFAULT: yup.string().oneOf(COLOR_THEME_IDS),

    // 5. Features configuration
    NEXT_PUBLIC_API_SPEC_URL: yup.string().test(urlTest),
    NEXT_PUBLIC_STATS_API_HOST: yup.string().test(urlTest),
    NEXT_PUBLIC_STATS_API_BASE_PATH: yup.string(),
    NEXT_PUBLIC_VISUALIZE_API_HOST: yup.string().test(urlTest),
    NEXT_PUBLIC_VISUALIZE_API_BASE_PATH: yup.string(),
    NEXT_PUBLIC_CONTRACT_INFO_API_HOST: yup.string().test(urlTest),
    NEXT_PUBLIC_NAME_SERVICE_API_HOST: yup.string().test(urlTest),
    NEXT_PUBLIC_METADATA_SERVICE_API_HOST: yup.string().test(urlTest),
    NEXT_PUBLIC_ADMIN_SERVICE_API_HOST: yup.string().test(urlTest),
    NEXT_PUBLIC_GRAPHIQL_TRANSACTION: yup.string().matches(regexp.HEX_REGEXP),
    NEXT_PUBLIC_WEB3_WALLETS: yup
      .mixed()
      .test('shape', 'Invalid schema were provided for NEXT_PUBLIC_WEB3_WALLETS, it should be either array or "none" string literal', (data) => {
        const isNoneSchema = yup.string().equals([ 'none' ]);
        const isArrayOfWalletsSchema = yup
          .array()
          .transform(replaceQuotes)
          .json()
          .of(yup.string<WalletType>().oneOf(SUPPORTED_WALLETS));

        return isNoneSchema.isValidSync(data) || isArrayOfWalletsSchema.isValidSync(data);
      }),
    NEXT_PUBLIC_WEB3_DISABLE_ADD_TOKEN_TO_WALLET: yup.boolean(),
    NEXT_PUBLIC_TRANSACTION_INTERPRETATION_PROVIDER: yup.string().oneOf(TX_INTERPRETATION_PROVIDERS),
    NEXT_PUBLIC_AD_TEXT_PROVIDER: yup.string<AdTextProviders>().oneOf(SUPPORTED_AD_TEXT_PROVIDERS),
    NEXT_PUBLIC_PROMOTE_BLOCKSCOUT_IN_TITLE: yup.boolean(),
    NEXT_PUBLIC_OG_DESCRIPTION: yup.string(),
    NEXT_PUBLIC_OG_IMAGE_URL: yup.string().test(urlTest),
    NEXT_PUBLIC_OG_ENHANCED_DATA_ENABLED: yup.boolean(),
    NEXT_PUBLIC_SEO_ENHANCED_DATA_ENABLED: yup.boolean(),
    NEXT_PUBLIC_SAFE_TX_SERVICE_URL: yup.string().test(urlTest),
    NEXT_PUBLIC_IS_SUAVE_CHAIN: yup.boolean(),
    NEXT_PUBLIC_HAS_USER_OPS: yup.boolean(),
    NEXT_PUBLIC_METASUITES_ENABLED: yup.boolean(),
    NEXT_PUBLIC_MULTICHAIN_BALANCE_PROVIDER_CONFIG: yup
      .mixed()
      .test('shape', 'Invalid schema were provided for NEXT_PUBLIC_MULTICHAIN_BALANCE_PROVIDER_CONFIG, it should have name and url template', (data) => {
        const isUndefined = data === undefined;
        const valueSchema = yup.object<MultichainProviderConfig>().transform(replaceQuotes).json().shape({
          name: yup.string().required(),
          url_template: yup.string().required(),
          logo: yup.string(),
          dapp_id: yup.string(),
        });

        return isUndefined || valueSchema.isValidSync(data);
      }),
    NEXT_PUBLIC_VALIDATORS_CHAIN_TYPE: yup.string<ValidatorsChainType>().oneOf(VALIDATORS_CHAIN_TYPE),
    NEXT_PUBLIC_GAS_TRACKER_ENABLED: yup.boolean(),
    NEXT_PUBLIC_GAS_TRACKER_UNITS: yup.array().transform(replaceQuotes).json().of(yup.string<GasUnit>().oneOf(GAS_UNITS)),
    NEXT_PUBLIC_DATA_AVAILABILITY_ENABLED: yup.boolean(),
    NEXT_PUBLIC_DEFI_DROPDOWN_ITEMS: yup
      .array()
      .transform(replaceQuotes)
      .json()
      .of(deFiDropdownItemSchema),
    NEXT_PUBLIC_FAULT_PROOF_ENABLED: yup.boolean()
      .when('NEXT_PUBLIC_ROLLUP_TYPE', {
        is: 'optimistic',
        then: (schema) => schema,
        otherwise: (schema) => schema.test(
          'not-exist',
          'NEXT_PUBLIC_FAULT_PROOF_ENABLED can only be used with NEXT_PUBLIC_ROLLUP_TYPE=optimistic',
          value => value === undefined,
        ),
      }),

    // 6. External services envs
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: yup.string(),
    NEXT_PUBLIC_RE_CAPTCHA_APP_SITE_KEY: yup.string(),
    NEXT_PUBLIC_GOOGLE_ANALYTICS_PROPERTY_ID: yup.string(),
    NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN: yup.string(),
    NEXT_PUBLIC_GROWTH_BOOK_CLIENT_KEY: yup.string(),

    // Misc
    NEXT_PUBLIC_USE_NEXT_JS_PROXY: yup.boolean(),
  })
  .concat(accountSchema)
  .concat(adsBannerSchema)
  .concat(marketplaceSchema)
  .concat(rollupSchema)
  .concat(beaconChainSchema)
  .concat(bridgedTokensSchema)
  .concat(sentrySchema);

export default schema;
