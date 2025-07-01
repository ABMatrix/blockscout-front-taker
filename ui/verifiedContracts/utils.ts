import type { VerifiedContractsSortingValue, VerifiedContractsSortingField } from 'types/api/verifiedContracts';

import type { Option } from 'ui/shared/sort/Sort';

export const SORT_OPTIONS: Array<Option<VerifiedContractsSortingValue>> = [
  { title: 'Default', id: undefined },
  { title: 'Balance descending', id: 'balance-desc' },
  { title: 'Balance ascending', id: 'balance-asc' },
  { title: 'Txs count descending', id: 'transaction_count-desc' },
  { title: 'Txs count ascending', id: 'transaction_count-asc' },
];

export const SORT_SEQUENCE: Record<VerifiedContractsSortingField, Array<VerifiedContractsSortingValue | undefined>> = {
  balance: [ 'balance-desc', 'balance-asc', undefined ],
  transaction_count: [ 'transaction_count-desc', 'transaction_count-asc', undefined ],
};
