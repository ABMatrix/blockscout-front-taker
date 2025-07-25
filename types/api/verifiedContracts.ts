export interface VerifiedContractsSorting {
  sort: 'balance' | 'transaction_count';
  order: 'asc' | 'desc';
}

export type VerifiedContractsSortingField = VerifiedContractsSorting['sort'];

export type VerifiedContractsSortingValue = `${ VerifiedContractsSortingField }-${ VerifiedContractsSorting['order'] }`;
