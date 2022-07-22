import { Trans } from '@lingui/macro'
import CurrencyLogo from 'components/CurrencyLogo'
import { useCurrency, useToken } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { TimePeriod, TokenData } from 'hooks/useTopTokens'
import { useAtom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { ReactNode } from 'react'
import { ArrowDown, ArrowDownRight, ArrowUp, ArrowUpRight, Heart } from 'react-feather'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { formatAmount, formatDollarAmount } from 'utils/formatDollarAmt'

import {
  LARGE_MEDIA_BREAKPOINT,
  MAX_WIDTH_MEDIA_BREAKPOINT,
  MEDIUM_MEDIA_BREAKPOINT,
  MOBILE_MEDIA_BREAKPOINT,
  SMALL_MEDIA_BREAKPOINT,
} from '../constants'
import {
  favoritesAtom,
  filterTimeAtom,
  sortCategoryAtom,
  sortDirectionAtom,
  useSetSortCategory,
  useToggleFavorite,
} from '../state'
import { Category, SortDirection } from '../types'
import { TIME_DISPLAYS } from './TimeSelector'

const ArrowCell = styled.div`
  padding-left: 2px;
  display: flex;
`
const Cell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`
const StyledTokenRow = styled.div`
  width: 100%;
  height: 60px;
  display: grid;
  grid-template-columns: 1.2fr 1fr 7fr 4fr 4fr 4fr 4fr 5fr;
  font-size: 15px;
  line-height: 24px;

  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  min-width: 390px;
  padding: 0px 12px;

  &:hover {
    background-color: ${({ theme }) => theme.backgroundContainer};
  }

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1.7fr 1fr 6.5fr 4.5fr 4.5fr 4.5fr 4.5fr;
    width: fit-content;
    padding-right: 24px;
  }

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1.7fr 1fr 7.5fr 4.5fr 4.5fr 4.5fr;
    width: fit-content;
  }

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1.2fr 1fr 8fr 5fr 5fr;
    width: fit-content;
  }

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 7fr 4fr 4fr 0.5px;
    width: fit-content;
  }

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    grid-template-columns: 12fr 6fr;
    width: fit-content;
    min-width: unset;
    border-bottom: 0.5px solid ${({ theme }) => theme.backgroundContainer};
    padding: 0px 12px;

    :last-of-type {
      border-bottom: none;
    }
  }
`
export const ClickFavorited = styled.span`
  display: flex;
  align-items: center;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.accentActive};
  }
`
const ClickableName = styled(Link)`
  display: flex;
  gap: 8px;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
`
const FavoriteCell = styled(Cell)`
  min-width: 40px;
  color: ${({ theme }) => theme.textSecondary};
  fill: none;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const StyledHeaderRow = styled(StyledTokenRow)`
  width: 100%;
  height: 48px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 12px;
  line-height: 16px;
  border-bottom: 1px solid;
  border-color: ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px 8px 0px 0px;
  padding: 0px 12px;

  &:hover {
    background-color: ${({ theme }) => theme.backgroundSurface};
  }

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    padding-right: 24px;
  }

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const ListNumberCell = styled(Cell)`
  color: ${({ theme }) => theme.textSecondary};
  min-width: 32px;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const MarketCapCell = styled(Cell)<{ sortable: boolean }>`
  justify-content: flex-end;
  min-width: max-content;
  padding-right: 4px;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    display: none;
  }

  &:hover {
    background-color: ${({ theme, sortable }) => sortable && theme.backgroundContainer};
  }
`
const NameCell = styled(Cell)`
  justify-content: flex-start;
  padding-left: 8px;
  min-width: 200px;
  gap: 8px;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    min-width: fit-content;
    padding-right: 8px;
  }
`

const PercentChangeCell = styled(Cell)<{ sortable: boolean }>`
  justify-content: flex-end;
  min-width: 80px;
  padding-right: 4px;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    display: none;
  }

  &:hover {
    background-color: ${({ theme, sortable }) => sortable && theme.backgroundContainer};
  }
`
const PercentChangeInfoCell = styled(Cell)`
  display: none;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    display: flex;
    color: ${({ theme }) => theme.textSecondary};
    font-size: 12px;
    line-height: 16px;
  }
`
const PriceCell = styled(Cell)<{ sortable: boolean }>`
  justify-content: flex-end;
  min-width: 80px;
  padding-right: 4px;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    min-width: max-content;
  }

  &:hover {
    background-color: ${({ theme, sortable }) => sortable && theme.backgroundContainer};
  }
`
const PriceInfoCell = styled(Cell)`
  justify-content: flex-end;
  min-width: max-content;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    flex-direction: column;
  }
`
const SortArrowCell = styled(Cell)`
  padding-right: 2px;
`
const SortingCategory = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`
const SortOption = styled.span`
  cursor: pointer;
`
const SparkLineCell = styled(Cell)`
  padding: 0px 24px;
  min-width: 120px;

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const SparkLineImg = styled(Cell)`
  max-width: 124px;
  max-height: 28px;
  flex-direction: column;
  transform: scale(1.2);
`
const TokenInfoCell = styled(Cell)`
  gap: 8px;
  line-height: 24px;
  font-size: 16px;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    justify-content: flex-start;
    flex-direction: column;
    gap: 0px;
    width: max-content;
    font-weight: 500;
  }
`
const TokenName = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
  white-space: nowrap;
`
const TokenSymbol = styled(Cell)`
  color: ${({ theme }) => theme.textTertiary};

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    font-size: 12px;
    height: 16px;
    justify-content: flex-start;
    width: 100%;
  }
`
const VolumeCell = styled(Cell)<{ sortable: boolean }>`
  justify-content: flex-end;
  min-width: max-content;
  padding-right: 4px;

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    display: none;
  }

  &:hover {
    background-color: ${({ theme, sortable }) => sortable && theme.backgroundContainer};
  }
`
/* Loading state bubbles */
const LoadingBubble = styled.div`
  background-color: ${({ theme }) => theme.backgroundContainer};
  border-radius: 12px;
  height: 24px;
  width: 50%;
`
const SmallLoadingBubble = styled(LoadingBubble)`
  width: 25%;
`
const MediumLoadingBubble = styled(LoadingBubble)`
  width: 65%;
`
const LongLoadingBubble = styled(LoadingBubble)`
  width: 90%;
`
const IconLoadingBubble = styled(LoadingBubble)`
  border-radius: 50%;
  width: 24px;
`
const SparkLineLoadingBubble = styled(LongLoadingBubble)`
  height: 4px;
`

/* formatting for volume with timeframe header display */
function getHeaderDisplay(category: string, timeframe: string): string {
  if (category === Category.volume) return `${TIME_DISPLAYS[timeframe]} ${category}`
  return category
}

/* Get singular header cell for header row */
function HeaderCell({
  category,
  sortable,
}: {
  category: Category // TODO: change this to make it work for trans
  sortable: boolean
}) {
  const theme = useTheme()
  const sortDirection = useAtomValue<SortDirection>(sortDirectionAtom)
  const handleSortCategory = useSetSortCategory(category)
  const sortCategory = useAtomValue<Category>(sortCategoryAtom)
  const timeframe = useAtomValue<TimePeriod>(filterTimeAtom)

  if (sortCategory === category) {
    return (
      <SortingCategory onClick={handleSortCategory}>
        <SortArrowCell>
          {sortDirection === SortDirection.increasing ? (
            <ArrowDown size={14} color={theme.accentActive} />
          ) : (
            <ArrowUp size={14} color={theme.accentActive} />
          )}
        </SortArrowCell>
        <Trans>{getHeaderDisplay(category, timeframe)}</Trans>
      </SortingCategory>
    )
  }
  if (sortable) return <SortOption onClick={handleSortCategory}>{getHeaderDisplay(category, timeframe)}</SortOption>
  return <Trans>{getHeaderDisplay(category, timeframe)}</Trans>
}

/* Token Row: skeleton row component */
export function TokenRow({
  address,
  header,
  favorited,
  listNumber,
  tokenInfo,
  price,
  percentChange,
  marketCap,
  volume,
  sparkLine,
}: {
  address: ReactNode
  header: boolean
  favorited: ReactNode
  listNumber: ReactNode
  tokenInfo: ReactNode
  price: ReactNode
  percentChange: ReactNode
  marketCap: ReactNode
  volume: ReactNode
  sparkLine: ReactNode
}) {
  const rowCells = (
    <>
      <FavoriteCell>{favorited}</FavoriteCell>
      <ListNumberCell>{listNumber}</ListNumberCell>
      <NameCell>{tokenInfo}</NameCell>
      <PriceCell sortable={header}>{price}</PriceCell>
      <PercentChangeCell sortable={header}>{percentChange}</PercentChangeCell>
      <MarketCapCell sortable={header}>{marketCap}</MarketCapCell>
      <VolumeCell sortable={header}>{volume}</VolumeCell>
      <SparkLineCell>{sparkLine}</SparkLineCell>
    </>
  )
  if (header) return <StyledHeaderRow>{rowCells}</StyledHeaderRow>
  return <StyledTokenRow>{rowCells}</StyledTokenRow>
}

/* Header Row: top header row component for table */
export function HeaderRow() {
  /* TODO: access which sort category used and timeframe used (temporarily hardcoded values) */

  return (
    <TokenRow
      address={null}
      header={true}
      favorited={null}
      listNumber={null}
      tokenInfo={<Trans>Name</Trans>}
      price={<HeaderCell category={Category.price} sortable />}
      percentChange={<HeaderCell category={Category.percentChange} sortable />}
      marketCap={<HeaderCell category={Category.marketCap} sortable />}
      volume={<HeaderCell category={Category.volume} sortable />}
      sparkLine={null}
    />
  )
}

/* Loading State: row component with loading bubbles */
export function LoadingRow() {
  return (
    <TokenRow
      address={null}
      header={false}
      favorited={null}
      listNumber={<SmallLoadingBubble />}
      tokenInfo={
        <>
          <IconLoadingBubble />
          <MediumLoadingBubble />
        </>
      }
      price={<MediumLoadingBubble />}
      percentChange={<LoadingBubble />}
      marketCap={<LoadingBubble />}
      volume={<LoadingBubble />}
      sparkLine={<SparkLineLoadingBubble />}
    />
  )
}

/* Loaded State: row component with token information */
export default function LoadedRow({
  tokenAddress,
  data,
  listNumber,
  timePeriod,
}: {
  tokenAddress: string
  data: TokenData
  listNumber: number
  timePeriod: TimePeriod
}) {
  const token = useToken(tokenAddress)
  const currency = useCurrency(tokenAddress)
  const tokenName = token?.name ?? ''
  const tokenSymbol = token?.symbol ?? ''
  const tokenData = data[tokenAddress]
  const theme = useTheme()
  const [favoriteTokens] = useAtom(favoritesAtom)
  const isFavorited = favoriteTokens.includes(tokenAddress)
  const toggleFavorite = useToggleFavorite(tokenAddress)

  const tokenPercentChangeInfo = (
    <>
      {tokenData.delta}%
      <ArrowCell>
        {Math.sign(tokenData.delta) > 0 ? (
          <ArrowUpRight size={16} color={theme.accentSuccess} />
        ) : (
          <ArrowDownRight size={16} color={theme.accentFailure} />
        )}
      </ArrowCell>
    </>
  )

  const heartColor = isFavorited ? theme.accentActive : undefined
  // TODO: currency logo sizing mobile (32px) vs. desktop (24px)
  // TODO: fix listNumber as number on most popular (should be fixed)
  return (
    <TokenRow
      address={tokenAddress}
      header={false}
      favorited={
        <ClickFavorited onClick={toggleFavorite}>
          <Heart size={15} color={heartColor} fill={heartColor} />
        </ClickFavorited>
      }
      listNumber={listNumber}
      tokenInfo={
        <ClickableName to={`tokens/${tokenAddress}`}>
          <CurrencyLogo currency={currency} />
          <TokenInfoCell>
            <TokenName>{tokenName}</TokenName>
            <TokenSymbol>{tokenSymbol}</TokenSymbol>
          </TokenInfoCell>
        </ClickableName>
      }
      price={
        <PriceInfoCell>
          {formatDollarAmount(tokenData.price)}
          <PercentChangeInfoCell>{tokenPercentChangeInfo}</PercentChangeInfoCell>
        </PriceInfoCell>
      }
      percentChange={tokenPercentChangeInfo}
      marketCap={formatAmount(tokenData.marketCap).toUpperCase()}
      volume={formatAmount(tokenData.volume[timePeriod]).toUpperCase()}
      sparkLine={<SparkLineImg dangerouslySetInnerHTML={{ __html: tokenData.sparkline }} />}
    />
  )
}