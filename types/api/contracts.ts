import type { AddressParam } from './addressParams';
import type { SmartContractLicenseType } from './contract';

export interface VerifiedContract {
  address: AddressParam;
  certified?: boolean;
  coin_balance: string;
  compiler_version: string;
  language: 'vyper' | 'yul' | 'solidity';
  has_constructor_args: boolean;
  optimization_enabled: boolean;
  transaction_count: number | null;
  verified_at: string;
  market_cap: string | null;
  license_type: SmartContractLicenseType | null;
}

export interface VerifiedContractsResponse {
  items: Array<VerifiedContract>;
  next_page_params: {
    items_count: string;
    smart_contract_id: string;
  } | null;
}

export interface VerifiedContractsFilters {
  q: string | undefined;
  filter: 'vyper' | 'solidity' | 'yul' | undefined;
}

export type VerifiedContractsCounters = {
  new_smart_contracts_24h: string;
  new_verified_smart_contracts_24h: string;
  smart_contracts: string;
  verified_smart_contracts: string;
}
