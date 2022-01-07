import styled, { css } from 'styled-components';

type ButtonProps = {
	size?: 'sm' | 'md';
	variant?: 'success' | 'danger';
	mono?: boolean;
};

const Button = styled.button<ButtonProps>`
	width: 100%;
	cursor: pointer;
	position: relative;
	border-radius: 16px;

	color: #ece8e3;
	border: 1px solid #ffffff1a;
	background: linear-gradient(180deg, #39332d 0%, #2d2a28 100%);
	box-shadow: 0px 0px 20px 0px #ffffff08 inset;
	box-shadow: 0px 2px 2px 0px #00000040;

	&:hover {
		background: linear-gradient(180deg, #4f463d 0%, #332f2d 100%);
		box-shadow: 0px 2px 2px 0px #00000040;
	}

	${({ mono }) =>
		mono
			? css`
					font-family: ${(props) => props.theme.fonts.mono};
			  `
			: css`
					font-family: ${(props) => props.theme.fonts.bold};
			  `}

	${({ variant }) =>
		!!variant &&
		css`
			&:before {
				content: ' ';
				position: absolute;
				z-index: -1;
				top: -4px;
				right: -4px;
				bottom: -4px;
				left: -4px;
				border-radius: 18px;
			}

			&:hover {
				color: #ece8e3;
				text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.4);

				&:before {
					box-shadow: 0px 2px 2px 0px #00000040;
				}
			}
		`};

	${({ variant }) =>
		!!variant &&
		(variant === 'success'
			? css`
					color: #7fd482;
					border: 2px solid #7fd482;

					&:hover {
						background: linear-gradient(
							180deg,
							rgba(127, 212, 130, 0.5) 0%,
							rgba(71, 122, 73, 0.5) 100%
						);

						&:before {
							border: 2px solid rgba(127, 212, 130, 0.2);
						}
					}
			  `
			: css`
					color: #ef6868;
					border: 2px solid #ef6868;

					&:hover {
						background: linear-gradient(
							180deg,
							rgba(239, 104, 104, 0.5) 0%,
							rgba(116, 56, 56, 0.5) 100%
						);

						&:before {
							border: 2px solid rgba(239, 104, 104, 0.2);
						}
					}
			  `)}

	${({ size }) =>
		!size || size === 'md'
			? css`
					height: 55px;
			  `
			: css`
					height: 36px;
			  `}
`;

export default Button;
