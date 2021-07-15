import { FC, useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useRecoilState } from 'recoil';

import { Synth, Synths } from '@synthetixio/contracts-interface';

import Select from 'components/Select';

import { CardTitle } from 'sections/dashboard/common';

import { FlexDivRowCentered } from 'styles/common';

import SynthRow from './SynthRow';
import { numericSort } from './utils';
import { SYNTH_SORT_OPTIONS, SynthSort } from './constants';
import { trendingSynthsOptionState } from 'store/ui';
import useSynthetixQueries, { HistoricalRatesUpdates } from '@synthetixio/queries';
import { CurrencyKey } from 'constants/currency';
import mapValues from 'lodash/mapValues';
import Connector from 'containers/Connector';

const TrendingSynths: FC = () => {
	const { t } = useTranslation();

	const { synthetixjs } = Connector.useContainer();

	const [currentSynthSort, setCurrentSynthSort] = useRecoilState(trendingSynthsOptionState);

	const {
		useExchangeRatesQuery,
		useHistoricalRatesQuery,
		useHistoricalVolumeQuery,
	} = useSynthetixQueries();

	const synths = synthetixjs?.synths || [];

	const exchangeRatesQuery = useExchangeRatesQuery();
	const historicalVolumeQuery = useHistoricalVolumeQuery();

	// ok for rules of hooks since `synths` is static for execution of the site
	const historicalRates: Partial<Record<CurrencyKey, HistoricalRatesUpdates>> = {};
	for (const synth of synths) {
		const historicalRateQuery = useHistoricalRatesQuery(synth.name); // eslint-disable-line react-hooks/rules-of-hooks

		if (historicalRateQuery.isSuccess) {
			historicalRates[synth.name] = historicalRateQuery.data!;
		}
	}

	const exchangeRates = exchangeRatesQuery.isSuccess ? exchangeRatesQuery.data ?? null : null;

	// bug in queries lib: should return already parsed with `parseBytes32String`
	const historicalVolume = historicalVolumeQuery.isSuccess ? historicalVolumeQuery.data : null;

	const sortedSynths = useMemo(() => {
		if (currentSynthSort.value === SynthSort.Price && exchangeRates != null) {
			return synths.sort((a: Synth, b: Synth) => numericSort(exchangeRates, a.name, b.name));
		}
		if (currentSynthSort.value === SynthSort.Volume && historicalVolume != null) {
			return synths.sort((a: Synth, b: Synth) => numericSort(historicalVolume, a.name, b.name));
		}
		if (historicalRates != null) {
			if (currentSynthSort.value === SynthSort.Rates24HHigh) {
				return synths.sort((a: Synth, b: Synth) =>
					numericSort(mapValues(historicalRates, 'high'), a.name, b.name)
				);
			}
			if (currentSynthSort.value === SynthSort.Rates24HLow) {
				return synths.sort((a: Synth, b: Synth) =>
					numericSort(mapValues(historicalRates, 'low'), a.name, b.name)
				);
			}
			if (currentSynthSort.value === SynthSort.Change) {
				return synths.sort((a: Synth, b: Synth) =>
					numericSort(mapValues(historicalRates, 'change'), a.name, b.name)
				);
			}
		}
		return synths;
	}, [synths, currentSynthSort, exchangeRates, historicalVolume, historicalRates]);

	return (
		<>
			<Container>
				<TitleSortContainer>
					<CardTitle>{t('dashboard.trending')}</CardTitle>
					<TrendingSortSelect
						inputId="synth-sort-options"
						formatOptionLabel={(option: any) => <span>{t(option.label)}</span>}
						options={SYNTH_SORT_OPTIONS}
						value={currentSynthSort}
						onChange={(option: any) => {
							if (option) {
								setCurrentSynthSort(option);
							}
						}}
					/>
				</TitleSortContainer>
			</Container>
			<Rows>
				{sortedSynths.map((synth: Synth) => {
					const price = exchangeRates && exchangeRates[synth.name];
					const currencyKey = synth;

					return <SynthRow key={synth.name} synth={synth} price={price} />;
				})}
			</Rows>
		</>
	);
};

const Container = styled.div`
	padding: 0 32px;
`;

const TitleSortContainer = styled(FlexDivRowCentered)`
	margin-top: -10px;
`;

const Rows = styled.div`
	overflow: auto;
	padding-top: 10px;
`;

const TrendingSortSelect = styled(Select)`
	width: 120px;
`;

export default TrendingSynths;
