import { wei } from '@synthetixio/wei';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import BaseModal from 'components/BaseModal';
import Button from 'components/Button';
import ErrorView from 'components/Error';
import CustomInput from 'components/Input/CustomInput';
import Loader from 'components/Loader';
import Spacer from 'components/Spacer';
import { NumberSpan } from 'components/Text/NumberLabel';
import { DEFAULT_LEVERAGE } from 'constants/defaults';
import { useFuturesContext } from 'contexts/FuturesContext';
import { useRefetchContext } from 'contexts/RefetchContext';
import { monitorTransaction } from 'contexts/RelayerContext';
import { ORDER_PREVIEW_ERRORS_I18N, previewErrorI18n } from 'queries/futures/constants';
import {
	editExistingPositionLeverage,
	editCrossMarginSize,
	setCrossMarginLeverage,
} from 'state/futures/actions';
import { setOrderType as setReduxOrderType } from 'state/futures/reducer';
import {
	selectCrossMarginBalanceInfo,
	selectCrossMarginSelectedLeverage,
	selectCrossMarginTradeFees,
	selectMarketInfo,
	selectOrderType,
	selectPosition,
	selectTradePreview,
	selectTradePreviewError,
} from 'state/futures/selectors';
import { useAppSelector, useAppDispatch } from 'state/hooks';
import { FlexDivRow, FlexDivRowCentered } from 'styles/common';
import { isUserDeniedError } from 'utils/formatters/error';
import { formatDollars, zeroBN } from 'utils/formatters/number';
import logError from 'utils/logError';

import FeeInfoBox from '../FeeInfoBox';
import LeverageSlider from '../LeverageSlider';
import MarginInfoBox from './CrossMarginInfoBox';

type DepositMarginModalProps = {
	onDismiss(): void;
	editMode: 'existing_position' | 'new_position';
};

export default function EditLeverageModal({ onDismiss, editMode }: DepositMarginModalProps) {
	const { t } = useTranslation();
	const { handleRefetch } = useRefetchContext();
	const dispatch = useAppDispatch();
	const { resetTradeState, submitCrossMarginOrder } = useFuturesContext();

	const onLeverageChange = useCallback(
		(leverage: number) => {
			dispatch(setCrossMarginLeverage(String(leverage)));
			dispatch(editCrossMarginSize('', 'usd'));
		},
		[dispatch]
	);

	const balanceInfo = useAppSelector(selectCrossMarginBalanceInfo);
	const market = useAppSelector(selectMarketInfo);
	const position = useAppSelector(selectPosition);
	const tradeFees = useAppSelector(selectCrossMarginTradeFees);
	const previewData = useAppSelector(selectTradePreview);
	const previewError = useAppSelector(selectTradePreviewError);
	const orderType = useAppSelector(selectOrderType);
	const selectedLeverage = useAppSelector(selectCrossMarginSelectedLeverage);

	const [leverage, setLeverage] = useState<number>(
		editMode === 'existing_position' && position?.position
			? Number(position.position.leverage.toNumber().toFixed(2))
			: Number(Number(selectedLeverage).toFixed(2))
	);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<null | string>(null);

	const totalMargin = useMemo(() => {
		return position?.remainingMargin.add(balanceInfo.freeMargin) ?? zeroBN;
	}, [position?.remainingMargin, balanceInfo.freeMargin]);

	const maxLeverage = Number((market?.maxLeverage || wei(DEFAULT_LEVERAGE)).toString(2));

	useEffect(() => {
		if (editMode === 'existing_position' && orderType !== 'market') {
			dispatch(setReduxOrderType('market'));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const maxPositionUsd = useMemo(() => {
		return totalMargin.mul(leverage);
	}, [totalMargin, leverage]);

	const handleIncrease = () => {
		let newLeverage = wei(leverage).add(1).toNumber();
		newLeverage = Math.max(newLeverage, 1);
		setLeverage(Math.min(newLeverage, maxLeverage));
		previewPositionChange(newLeverage);
	};

	const handleDecrease = () => {
		let newLeverage = wei(leverage).sub(1).toNumber();
		newLeverage = Math.max(newLeverage, 1);
		setLeverage(newLeverage);
		previewPositionChange(newLeverage);
	};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const previewPositionChange = useCallback(
		debounce((leverage: number) => {
			if (leverage >= 1) {
				editMode === 'existing_position'
					? dispatch(editExistingPositionLeverage(String(leverage)))
					: onLeverageChange(leverage);
			}
		}, 200),
		[onLeverageChange]
	);

	const onConfirm = useCallback(async () => {
		setError(null);
		if (editMode === 'existing_position' && position?.position) {
			try {
				setSubmitting(true);
				const tx = await submitCrossMarginOrder(true);
				if (tx?.hash) {
					monitorTransaction({
						txHash: tx.hash,
						onTxFailed(failureMessage) {
							setError(failureMessage?.failureReason || t('common.transaction.transaction-failed'));
						},
						onTxConfirmed: () => {
							try {
								resetTradeState();
								handleRefetch('modify-position');
								handleRefetch('account-margin-change');
								setSubmitting(false);
								onDismiss();
							} catch (err) {
								logError(err);
							}
						},
					});
				}
			} catch (err) {
				setSubmitting(false);
				setError(t('common.transaction.transaction-failed'));
				logError(err);
			}
			resetTradeState();
		} else {
			// TODO: consolidate leverage states
			onLeverageChange(leverage);
			dispatch(setCrossMarginLeverage(String(leverage)));
			onDismiss();
		}
	}, [
		leverage,
		position?.position,
		editMode,
		setSubmitting,
		resetTradeState,
		t,
		onLeverageChange,
		submitCrossMarginOrder,
		setError,
		handleRefetch,
		onDismiss,
		dispatch,
	]);

	const onClose = () => {
		if (position?.position) {
			resetTradeState();
		}
		onDismiss();
	};

	useEffect(() => {
		if (position?.position) {
			// Clear size inputs on mount if there is a position open
			resetTradeState();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const errorMessage = useMemo(
		() => error || previewError || (previewData?.showStatus && previewData?.statusMessage),
		[error, previewError, previewData?.showStatus, previewData?.statusMessage]
	);

	return (
		<StyledBaseModal
			title={t(`futures.market.trade.leverage.modal.title`)}
			isOpen
			onDismiss={onClose}
		>
			<Label>{t('futures.market.trade.leverage.modal.input-label')}:</Label>
			<InputContainer
				dataTestId="futures-market-trade-leverage-modal-input"
				value={String(leverage)}
				onChange={(_, v) => {
					const nextLeverage = Math.min(Number(v), maxLeverage);
					setLeverage(nextLeverage);
					previewPositionChange(nextLeverage);
				}}
				right={<MaxButton onClick={handleIncrease}>+</MaxButton>}
				left={<MaxButton onClick={handleDecrease}>-</MaxButton>}
				textAlign="center"
			/>
			<SliderOuter>
				<Spacer height={55} />

				<SliderInner>
					<FlexDivRow>
						<LeverageSlider
							minValue={1}
							maxValue={maxLeverage}
							value={leverage}
							onChange={(_, newValue) => {
								setLeverage(newValue as number);
								previewPositionChange(newValue as number);
							}}
							onChangeCommitted={() => {}}
						/>
					</FlexDivRow>
				</SliderInner>
			</SliderOuter>

			{editMode === 'new_position' && (
				<MaxPosContainer>
					<Label>{t('futures.market.trade.leverage.modal.max-pos')}</Label>
					<Label>
						<NumberSpan fontWeight="bold">{formatDollars(maxPositionUsd)}</NumberSpan> sUSD
					</Label>
				</MaxPosContainer>
			)}

			{position?.position && editMode === 'existing_position' && (
				<>
					<Spacer height={15} />
					<MarginInfoBox editingLeverage />
					{tradeFees.total.gt(0) && <FeeInfoBox />}
				</>
			)}

			<MarginActionButton
				disabled={
					!!previewError ||
					(editMode === 'existing_position' && (!previewData || !!errorMessage)) ||
					leverage < 1
				}
				data-testid="futures-market-trade-deposit-margin-button"
				fullWidth
				onClick={onConfirm}
			>
				{submitting ? <Loader /> : t('futures.market.trade.leverage.modal.confirm')}
			</MarginActionButton>

			{errorMessage && !isUserDeniedError(errorMessage) && (
				<>
					<Spacer height={12} />
					<ErrorView
						message={t(getStatusMessageI18n(errorMessage, previewError))}
						formatter="revert"
					/>
				</>
			)}
		</StyledBaseModal>
	);
}

// TODO: Clean up preview error messaging

const getStatusMessageI18n = (message: string, previewError: string | null | undefined) => {
	if (message === 'insufficient_margin' || message === 'Insufficient margin') {
		return ORDER_PREVIEW_ERRORS_I18N.insufficient_margin_edit_leverage;
	} else if (message === 'insufficient_free_margin' || message === 'Insufficient free margin') {
		return ORDER_PREVIEW_ERRORS_I18N.insufficient_free_margin_edit_leverage;
	}
	if (previewError) return previewErrorI18n(previewError);
	return 'futures.market.trade.edit-leverage.failed';
};

const StyledBaseModal = styled(BaseModal)`
	[data-reach-dialog-content] {
		width: 400px;
	}
`;

const MaxPosContainer = styled(FlexDivRowCentered)`
	margin-top: 15px;
	p {
		margin: 0;
	}
`;

const Label = styled.p`
	font-size: 13px;
	color: ${(props) => props.theme.colors.selectedTheme.gray};
`;

const MarginActionButton = styled(Button)`
	margin-top: 16px;
	height: 55px;
	font-size: 15px;
`;

const MaxButton = styled.div`
	padding: 4px 10px;
	font-size: 18px;
	font-weight: 400;
	font-family: ${(props) => props.theme.fonts.mono};
	color: ${(props) => props.theme.colors.selectedTheme.gray};
	cursor: pointer;
`;

const InputContainer = styled(CustomInput)`
	margin-bottom: 15px;
`;

const SliderOuter = styled.div`
	position: relative;
`;

const SliderInner = styled.div`
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
`;
