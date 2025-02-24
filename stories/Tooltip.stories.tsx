import * as Text from 'components/Text';
import StyledTooltip from 'components/Tooltip/StyledTooltip';

export default {
	title: 'Components/Tooltip',
	component: StyledTooltip,
};

export const Default = () => {
	return (
		<StyledTooltip height="auto" preset="fixed" content="This is the tooltip text">
			<Text.Body>Hover over this text</Text.Body>
		</StyledTooltip>
	);
};
