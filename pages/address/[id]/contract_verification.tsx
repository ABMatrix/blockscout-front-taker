import type { NextPage } from 'next';
import Head from 'next/head';
import React from 'react';

import type { PageParams } from 'lib/next/address/types';

import getSeo from 'lib/next/address/getSeo';
import ContractVerification from 'ui/pages/ContractVerification';

const ContractVerificationPage: NextPage<PageParams> = ({ id }: PageParams) => {
  const { title, description } = getSeo({ id });

  return (
    <>
      <Head>
        <title>{ title }</title>
        <meta name="description" content={ description }/>
      </Head>
      <ContractVerification/>
    </>
  );
};

export default ContractVerificationPage;

export { getServerSideProps } from 'lib/next/getServerSideProps';