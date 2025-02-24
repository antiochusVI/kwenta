import styled from 'styled-components';

const InputTitle = styled.div<{ margin?: string }>`
	color: ${(props) => props.theme.colors.selectedTheme.button.text.primary};
	font-size: 13px;
	margin: ${(props) => props.margin || '0'};
	span {
		color: ${(props) => props.theme.colors.selectedTheme.gray};
	}
`;

export default InputTitle;
