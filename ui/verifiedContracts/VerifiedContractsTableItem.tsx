import { Tr, Td, Flex, chakra, Tooltip, Skeleton } from '@chakra-ui/react';
import BigNumber from 'bignumber.js';
import React from 'react';

import type { VerifiedContract } from 'types/api/contracts';

import config from 'configs/app';
import { CONTRACT_LICENSES } from 'lib/contracts/licenses';
import dayjs from 'lib/date/dayjs';
import ContractCertifiedLabel from 'ui/shared/ContractCertifiedLabel';
import CopyToClipboard from 'ui/shared/CopyToClipboard';
import AddressEntity from 'ui/shared/entities/address/AddressEntity';
import HashStringShorten from 'ui/shared/HashStringShorten';
import IconSvg from 'ui/shared/IconSvg';

interface Props {
  data: VerifiedContract;
  isLoading?: boolean;
}

const VerifiedContractsTableItem = ({ data, isLoading }: Props) => {
  const balance = data.coin_balance && data.coin_balance !== '0' ?
    BigNumber(data.coin_balance).div(10 ** config.chain.currency.decimals).dp(6).toFormat() :
    '0';

  const license = (() => {
    const license = CONTRACT_LICENSES.find((license) => license.type === data.license_type);
    if (!license || license.type === 'none') {
      return '-';
    }

    return license.label;
  })();

  return (
    <Tr>
      <Td>
        <Flex alignItems="center" mt={ 1 }>
          <AddressEntity
            address={ data.address }
            isLoading={ isLoading }
            query={{ tab: 'contract' }}
            noCopy
          />
          { data.certified && <ContractCertifiedLabel iconSize={ 5 } boxSize={ 5 } ml={ 2 }/> }
        </Flex>
        <Flex alignItems="center" ml={ 7 }>
          <Skeleton isLoaded={ !isLoading } color="text_secondary" my={ 1 }>
            <HashStringShorten hash={ data.address.hash } isTooltipDisabled/>
          </Skeleton>
          <CopyToClipboard text={ data.address.hash } isLoading={ isLoading }/>
        </Flex>
      </Td>
      <Td isNumeric>
        <Skeleton isLoaded={ !isLoading } display="inline-block" my={ 1 }>
          { balance }
        </Skeleton>
      </Td>
      <Td isNumeric>
        <Skeleton isLoaded={ !isLoading } display="inline-block" my={ 1 }>
          { data.transaction_count ? data.transaction_count.toLocaleString() : '0' }
        </Skeleton>
      </Td>
      <Td>
        <Flex flexWrap="wrap" columnGap={ 2 }>
          <Skeleton isLoaded={ !isLoading } textTransform="capitalize" my={ 1 }>{ data.language }</Skeleton>
          <Skeleton isLoaded={ !isLoading } color="text_secondary" wordBreak="break-all" my={ 1 } cursor="pointer">
            <Tooltip label={ data.compiler_version }>
              <span>{ data.compiler_version.split('+')[0] }</span>
            </Tooltip>
          </Skeleton>
        </Flex>
      </Td>
      <Td>
        <Tooltip label={ isLoading ? undefined : 'Optimization' }>
          <chakra.span display="inline-block">
            { data.optimization_enabled ?
              <IconSvg name="check" boxSize={ 6 } color="green.500" cursor="pointer" isLoading={ isLoading }/> :
              <IconSvg name="cross" boxSize={ 6 } color="red.600" cursor="pointer" isLoading={ isLoading }/> }
          </chakra.span>
        </Tooltip>
        <Tooltip label={ isLoading ? undefined : 'Constructor args' }>
          <chakra.span display="inline-block" ml={ 2 }>
            { data.has_constructor_args ?
              <IconSvg name="check" boxSize={ 6 } color="green.500" cursor="pointer" isLoading={ isLoading }/> :
              <IconSvg name="cross" boxSize={ 6 } color="red.600" cursor="pointer" isLoading={ isLoading }/> }
          </chakra.span>
        </Tooltip>
      </Td>
      <Td>
        <Flex alignItems="center" columnGap={ 2 } my={ 1 }>
          <IconSvg name="status/success" boxSize={ 4 } color="green.500" isLoading={ isLoading }/>
          <Skeleton isLoaded={ !isLoading } color="text_secondary">
            <span>{ dayjs(data.verified_at).fromNow() }</span>
          </Skeleton>
        </Flex>
      </Td>
      <Td>
        <Skeleton isLoaded={ !isLoading } my={ 1 } display="inline-block">
          { license }
        </Skeleton>
      </Td>
    </Tr>
  );
};

export default React.memo(VerifiedContractsTableItem);
