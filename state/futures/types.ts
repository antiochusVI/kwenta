import Wei from '@synthetixio/wei';

import { FuturesAccountType } from 'queries/futures/types';
import { TransactionStatus } from 'sdk/types/common';
import {
	DelayedOrder,
	FuturesMarket,
	FuturesPosition,
	FuturesPositionHistory,
	FuturesPotentialTradeDetails,
	FuturesVolumes,
} from 'sdk/types/futures';
import { PositionSide } from 'sections/futures/types';
import { QueryStatus } from 'state/types';
import { FuturesMarketAsset, FuturesMarketKey } from 'utils/futures';

export type IsolatedMarginOrderType = 'delayed' | 'delayed offchain' | 'market';
export type CrossMarginOrderType = 'market' | 'stop market' | 'limit';

export type TradeSizeInputs<T = Wei> = {
	nativeSize: T;
	susdSize: T;
};

export type CrossMarginTradeInputs<T = Wei> = TradeSizeInputs<T> & {
	leverage: string;
};

export type CrossMarginTradeInputsWithDelta<T = Wei> = CrossMarginTradeInputs<T> & {
	nativeSizeDelta: T;
	susdSizeDelta: T;
};

export type IsolatedMarginTradeInputs<T = Wei> = TradeSizeInputs<T>;

export type FundingRateSerialized = {
	asset: FuturesMarketKey;
	fundingTitle: string;
	fundingRate: string | null;
};

export type FundingRate<T = Wei> = {
	asset: FuturesMarketKey;
	fundingTitle: string;
	fundingRate: T | null;
};

export type FuturesQueryStatuses = {
	markets: QueryStatus;
	crossMarginBalanceInfo: QueryStatus;
	dailyVolumes: QueryStatus;
	crossMarginPositions: QueryStatus;
	crossMarginPositionHistory: QueryStatus;
	isolatedPositions: QueryStatus;
	isolatedPositionHistory: QueryStatus;
	openOrders: QueryStatus;
	crossMarginSettings: QueryStatus;
	isolatedTradePreview: QueryStatus;
	crossMarginTradePreview: QueryStatus;
};

export type FuturesTransactionType =
	| 'deposit_cross_margin'
	| 'withdraw_cross_margin'
	| 'approve_cross_margin'
	| 'deposit_isolated'
	| 'withdraw_isolated'
	| 'modify_isolated'
	| 'close_isolated'
	| 'close_cross_margin'
	| 'cancel_delayed_isolated'
	| 'execute_delayed_isolated'
	| 'close_cross_margin';

export type FuturesTransaction = {
	type: FuturesTransactionType;
	status: TransactionStatus;
	error?: string;
	hash: string | null;
};

export type TransactionEstimation<T = Wei> = {
	error?: string | null | undefined;
	limit: T;
	cost: T;
};

export type TransactionEstimations = Record<FuturesTransactionType, TransactionEstimation<string>>;

export type TransactionEstimationPayload = {
	type: FuturesTransactionType;
	limit: string;
	cost: string;
	error?: string | null | undefined;
};

export type CrossMarginBalanceInfo<T = Wei> = {
	freeMargin: T;
	keeperEthBal: T;
	allowance: T;
};

export type CrossMarginSettings<T = Wei> = {
	tradeFee: T;
	limitOrderFee: T;
	stopOrderFee: T;
};

export type CrossMarginTradeFees<T = Wei> = {
	staticFee: T;
	crossMarginFee: T;
	limitStopOrderFee: T;
	keeperEthDeposit: T;
	total: T;
};

type FuturesErrors = {
	tradePreview?: string | undefined | null;
};

// TODO: Separate in some way by network and wallet
// so we can have persisted state between switching

export type FuturesState = {
	selectedType: FuturesAccountType;
	confirmationModalOpen: boolean;
	isolatedMargin: IsolatedMarginState;
	crossMargin: CrossMarginState;
	markets: FuturesMarket<string>[];
	queryStatuses: FuturesQueryStatuses;
	dailyMarketVolumes: FuturesVolumes<string>;
	transaction?: FuturesTransaction | undefined;
	transactionEstimations: TransactionEstimations;
	dynamicFeeRate: string;
	errors: FuturesErrors;
};

export type TradePreviewResult = {
	data: FuturesPotentialTradeDetails<string> | null;
	error: string | null;
};

export type CrossMarginState = {
	tradeInputs: CrossMarginTradeInputs<string>;
	marginDelta: string;
	orderType: CrossMarginOrderType;
	selectedLeverageByAsset: Partial<Record<FuturesMarketKey, string>>;
	leverageSide: PositionSide;
	selectedMarketKey: FuturesMarketKey;
	selectedMarketAsset: FuturesMarketAsset;
	showCrossMarginOnboard: boolean;
	position?: FuturesPosition<string>;
	balanceInfo: CrossMarginBalanceInfo<string>;
	tradePreview: FuturesPotentialTradeDetails<string> | null;
	account: string | undefined;
	settings: CrossMarginSettings<string>;
	fees: CrossMarginTradeFees<string>;
	orderPrice: {
		price?: string | undefined | null;
		invalidLabel: string | undefined | null;
	};
	positions: {
		[account: string]: FuturesPosition<string>[];
	};
	positionHistory: {
		[account: string]: FuturesPositionHistory<string>[];
	};
	openOrders: {
		[account: string]: DelayedOrder<string>[];
	};
};

export type IsolatedMarginState = {
	tradeInputs: IsolatedMarginTradeInputs<string>;
	orderType: IsolatedMarginOrderType;
	tradePreview: FuturesPotentialTradeDetails<string> | null;
	leverageSide: PositionSide;
	selectedMarketKey: FuturesMarketKey;
	selectedMarketAsset: FuturesMarketAsset;
	position?: FuturesPosition<string>;
	leverageInput: string;
	priceImpact: string;
	tradeFee: string;
	positions: {
		[account: string]: FuturesPosition<string>[];
	};
	positionHistory: {
		[account: string]: FuturesPositionHistory<string>[];
	};
	openOrders: {
		[account: string]: DelayedOrder<string>[];
	};
};

export type ModifyIsolatedPositionInputs = {
	sizeDelta: Wei;
	delayed: boolean;
	offchain: boolean;
};

export type CancelDelayedOrderInputs = {
	marketAddress: string;
	isOffchain: boolean;
};

export const futuresPositionKeys = new Set([
	'remainingMargin',
	'accessibleMargin',
	'order.fee',
	'order.leverage',
	'position.notionalValue',
	'position.accruedFunding',
	'position.initialMargin',
	'position.profitLoss',
	'position.lastPrice',
	'position.size',
	'position.liquidationPrice',
	'position.initialLeverage',
	'position.leverage',
	'position.pnl',
	'position.pnlPct',
	'position.marginRatio',
]);

export const futuresPositionHistoryKeys = new Set([
	'size',
	'feesPaid',
	'netFunding',
	'netTransfers',
	'totalDeposits',
	'initialMargin',
	'margin',
	'entryPrice',
	'avgEntryPrice',
	'exitPrice',
	'leverage',
	'pnl',
	'pnlWithFeesPaid',
	'totalVolume',
]);
