import { useMutation } from "@apollo/client";
import {
	IonButton,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonContent,
	IonHeader,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	IonText,
	IonTitle,
	IonToolbar,
	useIonLoading,
	useIonToast,
	IonLabel,
	IonSegment,
	IonSegmentButton,
	IonSegmentContent,
	IonSegmentView,
	IonModal,
	SegmentValue,
	IonList,
	IonItem,
	IonSelect,
	IonSelectOption,
	IonProgressBar,
	IonBadge,
	IonSpinner,
	IonChip,
	IonFooter,
} from "@ionic/react";

import React, { useState, useEffect } from "react";
import DigitInput from "../components/DigitInput";
import { PLACE_BET } from "../graphql/queries";
import xteriumService from "../services/xteriumService";
import useAppStore from "../store/useAppStore";
import lotteryService from "../services/lotteryService";
import walletService from "../services/walletService";
import { execute } from "graphql";

interface DashboardPageProps {
	data: any;
	loading: boolean;
	refetch: () => Promise<any>;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
	data,
	loading,
	refetch,
}) => {
	const { walletAddress, globalBetNumber, setGlobalBetNumber, referralUpline } = useAppStore();
	const [betNumber, setBetNumber] = useState("");
	const [presentLoading, dismissLoading] = useIonLoading();
	const [presentToast] = useIonToast();
	const [selectedSegment, setSelectedSegment] = useState<SegmentValue>("first");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [confirmationModal, setConfirmationModal] = useState(false);
	const [winnersModal, setWinnersModal] = useState(false)
	const [draw, setDraw] = useState("1");
	const [winnerNumber, setWinnerNumber] = useState("");
	const [isWinnerNumberLoading, setIsWinnerNumberLoading] = useState(false);
	const [signedHex, setSignedHex] = useState("");
	const [progress, setProgress] = useState(0);
	const [jackpot, setJackpot] = useState("")
	const [isJackpotLoading, setIsJackpotLoading] = useState(false)
	const [numberOfTicketsSold, setNumberOfTicketsSold] = useState(0)
	const [maximumBets, setMaximumBets] = useState('')


	const [placeBet, { loading: placingBet }] = useMutation(PLACE_BET, {
		onCompleted: (data) => {
			presentToast({
				message: `Bet placed successfully! Tx: ${data.placeBet.transactionHash.substring(
					0,
					10
				)}...`,
				duration: 1000,
				color: "success",
			});
			setBetNumber("");
			refetch();
		},
		onError: (error) => {
			presentToast({
				message: error.message,
				duration: 1000,
				color: "danger",
			});
		},
	});

	const handleCancel = () => {
		window.history.replaceState({}, document.title, window.location.pathname);
		setConfirmationModal(false);
		setGlobalBetNumber(0);
	};


	const handleOpen = () => {
		if (betNumber.trim().length !== 3) {
			presentToast({
				message: "Please enter a 3-digit number.",
				duration: 2000,
				color: "warning",
			});
			return;
		}
		setIsModalOpen(true);
	};

	const handlePlaceBet = async () => {
		if (!walletAddress) {
			presentToast({
				message: "Wallet not connected.",
				duration: 2000,
				color: "danger",
			});
			return;
		}

		const persistedBetNumber = Number(betNumber);
		setGlobalBetNumber(persistedBetNumber);
		await presentLoading({ message: "Waiting for signature..." });

		try {
			const result = await lotteryService.addBet();

			if (!result.success) {
				presentToast({
					message: `Add bet failed: ${result.message}`,
					color: "danger",
					duration: 5000,
				});
				return;
			}
			setBetNumber(betNumber);
			const hex = result.message
			const signed_hex = await walletService.signTransaction(
				hex,
				walletAddress
			);
		} catch (e: any) {
			presentToast({
				message: e.message || "An error occurred.",
				duration: 3000,
				color: "danger",
			});
		} finally {
			dismissLoading();
		}
	};

	const handleOpenWinnersModal = () => {
		setWinnersModal(true)
	}

	const handleCloseWinnersModal = () => {
		setWinnersModal(false)
	}

	const handleRefresh = (event: CustomEvent) => {
		refetch().finally(() => event.detail.complete());
	};

	// IF EVER YOU CHANGE UR MIND, FETCH getDraws and getLotterySetup after registration and ask bro how we could handle things for better efficiency
	useEffect(() => {
		const getDraws = async () => {
			try {
				setIsWinnerNumberLoading(true);
				setIsJackpotLoading(true)
				const data = await lotteryService.getDraws();

				if(!data.success) {
					presentToast({ message: `${data.message}`, duration: 3000, color: "warning", });
				}

				const winningNumber = data.winningNumber;
				setIsWinnerNumberLoading(false);
				setIsJackpotLoading(false)
				setJackpot(data.jackpot || '0')
				setNumberOfTicketsSold(data.bets)
				setWinnerNumber(winningNumber || 'N/A'); // update state
			} catch (error) {
				presentToast({ message: `${error}`, duration: 3000, color: "danger", });
				setWinnerNumber('N/A')
				setIsWinnerNumberLoading(false)
				setIsJackpotLoading(false)
			}
		};
		getDraws();
	}, []);

	useEffect(() => {
		const getLotterySetup = async () => {
			try {
				const data = await lotteryService.getLotterySetup()
				if(!data.success) {
					throw new Error('Failed to fetch')
				}
				setMaximumBets(data.maximumBets || '0')
			} catch (error) {
				presentToast({ message: `${error}`, duration: 3000, color: "danger", });
			}
		}
		getLotterySetup()
	}, [])

	const handleSubmit = async () => {
		presentLoading("Submitting transaction...");
		window.history.replaceState({}, document.title, window.location.pathname);
		const payload = {
				signed_hex: signedHex,
				draw_number: draw,
				bet_number: globalBetNumber,
				bettor: walletAddress!,
				upline: referralUpline || import.meta.env.VITE_OPERATOR_ADDRESS,
			};

			const executeBet = await lotteryService.executeBet(payload);

		try {
			

			if(!executeBet.success) {
				throw new Error
			}

			presentToast({
				message: `${executeBet.message}`,
				duration: 10000,
				color: "success",
			});
		} catch (error) {
			presentToast({
				message: `${executeBet.message}`,
				duration: 10000,
				color: "danger",
			});
		} finally {
			dismissLoading();
			setConfirmationModal(false);
		}
	};

	useEffect(() => {
		const run = async () => {
			try {
				const response = await walletService.checkSignedTxFromUrl();

				if (!response.success) return
				setConfirmationModal(true);

				setSignedHex(response.signedTx);
			} catch (err) {
				presentToast({
					message: `Error: ${String(err)}`,
					duration: 5000,
					color: "danger",
				});
			} finally {
				await dismissLoading();
			}
		};

		run();
	}, []);

	useEffect(() => {
		if (!confirmationModal) return;

		setProgress(0);

		const duration = 5000;
		const interval = 50;
		let current = 0;

		const timer = setInterval(() => {
			current += interval;
			setProgress(current / duration);

			if (current >= duration) {
				clearInterval(timer);
				setConfirmationModal(false);
				setGlobalBetNumber(0);
				window.history.replaceState(
					{},
					document.title,
					window.location.pathname
				);
			}
		}, interval);
		return () => clearInterval(timer);
	}, [confirmationModal]);

	const cycle = data?.currentCycle;

	return (
		<IonPage>
			<IonHeader translucent={true}>
				<IonToolbar>
					<IonTitle>🛖 Dashboard</IonTitle>
					{walletAddress && (
						<IonLabel
							slot="end"
							className="ion-padding-end"
							style={{ fontSize: "0.8rem", opacity: 0.8 }}
						>
							{walletAddress.substring(0, 6)}...
							{walletAddress.substring(walletAddress.length - 4)}
						</IonLabel>
					)}
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				<IonRefresher
					slot="fixed"
					onIonRefresh={handleRefresh}
				>
					<IonRefresherContent></IonRefresherContent>
				</IonRefresher>

				<div className="fade-in">
					<IonSegment
						value={selectedSegment}
						onIonChange={(e) => setSelectedSegment(e.detail.value!)}
					>
						<IonSegmentButton value="first">
							<IonLabel color="primary">10 AM Draw</IonLabel>
						</IonSegmentButton>
						<IonSegmentButton value="second">
							<IonLabel color="primary">10 PM Draw</IonLabel>
						</IonSegmentButton>
					</IonSegment>

					{selectedSegment === "first" && (
						<div
							className="fade-in"
							style={{ padding: "8px" }}
						>
							<IonCard
								className="custom-card"
								style={{ margin: "0 0 0 0" }}
							>
								<IonCardHeader>
									<IonCardTitle
										className="custom-card-title"
										style={{ display: "flex", alignItems: "center" }}
									>
										🎯 Draw # 1
										<IonBadge
											style={{
												background: "var(--gold-gradient)",
												color: "#000000",
												marginLeft: "auto", // pushes badge to the end
												fontWeight: "700",
												fontSize: "0.8rem",
											}}
										>
											JACKPOT ROLLED
										</IonBadge>
									</IonCardTitle>
								</IonCardHeader>
								<IonCardContent style={{ padding: "0" }}>
									<IonList
										lines="full"
										style={{ background: "transparent", padding: "0" }}
									>
										<IonItem
											style={
												{
													"--background": "transparent",
													"--border-color": "rgba(255, 215, 0, 0.2)",
													"--padding-start": "16px",
													"--inner-padding-end": "16px",
												} as any
											}
										>
											<IonLabel>
												<IonText
													style={{
														color: "var(--text-color-secondary)",
														fontSize: "0.9rem",
													}}
												>
													Winning Number
												</IonText>
											</IonLabel>
											<div style={{ display: "flex", gap: "8px" }}>
												{isWinnerNumberLoading ? (
													<div style={{ display: "flex", gap: "8px" }}>
														{[1, 2, 3].map((_, i) => (
															<div
																key={i}
																className="lottery-number"
																style={{
																	width: "45px",
																	height: "45px",
																	fontSize: "1.1rem",
																	opacity: 0.5,
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "center",
																}}
															>
																<IonSpinner name="crescent" />
															</div>
														))}
													</div>
												) : (
													winnerNumber
														.split("")
														.map((digit: string, index: number) => (
															<div
																key={index}
																className="lottery-number"
																style={{
																	width: "45px",
																	height: "45px",
																	fontSize: "1.1rem",
																}}
															>
																{digit}
															</div>
														))
												)}
											</div>
										</IonItem>
										<IonItem
											style={
												{
													"--background": "transparent",
													"--border-color": "rgba(255, 215, 0, 0.2)",
													"--padding-start": "16px",
													"--inner-padding-end": "16px",
												} as any
											}
										>
											<IonLabel>
												<IonText
													style={{
														color: "var(--text-color-secondary)",
														fontSize: "0.9rem",
													}}
												>
													Total Winners
												</IonText>
											</IonLabel>
											<div style={{
													display: "flex",
													alignItems: "center",
													gap: "8px", // 👈 adjust spacing here
												}}>
												<IonChip outline={true} color="success" onClick={handleOpenWinnersModal}>See winners</IonChip>
											</div>
										</IonItem>
										<IonItem
											style={
												{
													"--background": "transparent",
													"--border-color": "rgba(255, 215, 0, 0.2)",
													"--padding-start": "16px",
													"--inner-padding-end": "16px",
												} as any
											}
										>
											<IonLabel>
												<IonText
													style={{
														color: "var(--text-color-secondary)",
														fontSize: "0.9rem",
													}}
												>
													Total Jackpot
												</IonText>
											</IonLabel>
											<IonText
												style={{
													color: "var(--lottery-gold)",
													fontWeight: "700",
													fontSize: "1.1rem",
												}}
											>
												{isJackpotLoading ? (
													<IonSpinner name="dots" />
												): (
													 `$ ${jackpot || "0"}`
												)}
											</IonText>
										</IonItem>
										<IonItem
											style={
												{
													"--background": "transparent",
													"--padding-start": "16px",
													"--inner-padding-end": "16px",
												} as any
											}
										>
											<IonLabel>
												<IonText
													style={{
														color: "var(--text-color-secondary)",
														fontSize: "0.9rem",
													}}
												>
													Draw Date
												</IonText>
											</IonLabel>
											<IonText
												style={{
													color: "var(--text-color-secondary)",
													fontSize: "0.9rem",
												}}
											>
												Dec. 12, 2025
											</IonText>
										</IonItem>
									</IonList>
								</IonCardContent>
							</IonCard>
						</div>
					)}

					{selectedSegment === "second" && (
						<div
							className="fade-in"
							style={{ padding: "8px" }}
						>
							<IonCard
								className="custom-card"
								style={{ margin: "0 0 0 0" }}
							>
								<IonCardHeader>
									<IonCardTitle
										className="custom-card-title"
										style={{ display: "flex", alignItems: "center" }}
									>
										🎯 Draw # 2
										<IonBadge
											style={{
												background: "var(--gold-gradient)",
												color: "#000000",
												marginLeft: "auto", // pushes badge to the end
												fontWeight: "700",
												fontSize: "0.8rem",
											}}
										>
											JACKPOT ROLLED
										</IonBadge>
									</IonCardTitle>
								</IonCardHeader>
								<IonCardContent style={{ padding: "0" }}>
									<IonList
										lines="full"
										style={{ background: "transparent", padding: "0" }}
									>
										<IonItem
											style={
												{
													"--background": "transparent",
													"--border-color": "rgba(255, 215, 0, 0.2)",
													"--padding-start": "16px",
													"--inner-padding-end": "16px",
												} as any
											}
										>
											<IonLabel>
												<IonText
													style={{
														color: "var(--text-color-secondary)",
														fontSize: "0.9rem",
													}}
												>
													Winning Number
												</IonText>
											</IonLabel>
											<div style={{ display: "flex", gap: "8px" }}>
												{isWinnerNumberLoading ? (
													<div style={{ display: "flex", gap: "8px" }}>
														{[1, 2, 3].map((_, i) => (
															<div
																key={i}
																className="lottery-number"
																style={{
																	width: "45px",
																	height: "45px",
																	fontSize: "1.1rem",
																	opacity: 0.5,
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "center",
																}}
															>
																<IonSpinner name="crescent" />
															</div>
														))}
													</div>
												) : (
													winnerNumber
														.split("")
														.map((digit: string, index: number) => (
															<div
																key={index}
																className="lottery-number"
																style={{
																	width: "45px",
																	height: "45px",
																	fontSize: "1.1rem",
																}}
															>
																{digit}
															</div>
														))
												)}
											</div>
										</IonItem>
										<IonItem
											style={
												{
													"--background": "transparent",
													"--border-color": "rgba(255, 215, 0, 0.2)",
													"--padding-start": "16px",
													"--inner-padding-end": "16px",
												} as any
											}
										>
											<IonLabel>
												<IonText
													style={{
														color: "var(--text-color-secondary)",
														fontSize: "0.9rem",
													}}
												>
													Total Winners
												</IonText>
											</IonLabel>
											<IonText
												style={{
													color:
														0 > 1
															? "var(--lottery-emerald)"
															: "var(--text-color-secondary)",
													fontWeight: "700",
													fontSize: "1.1rem",
												}}
											>
												10
											</IonText>
										</IonItem>
										<IonItem
											style={
												{
													"--background": "transparent",
													"--border-color": "rgba(255, 215, 0, 0.2)",
													"--padding-start": "16px",
													"--inner-padding-end": "16px",
												} as any
											}
										>
											<IonLabel>
												<IonText
													style={{
														color: "var(--text-color-secondary)",
														fontSize: "0.9rem",
													}}
												>
													Total Jackpot
												</IonText>
											</IonLabel>
											<IonText
												style={{
													color: "var(--lottery-gold)",
													fontWeight: "700",
													fontSize: "1.1rem",
												}}
											>
												{jackpot || '0'}
											</IonText>
										</IonItem>
										<IonItem
											style={
												{
													"--background": "transparent",
													"--padding-start": "16px",
													"--inner-padding-end": "16px",
												} as any
											}
										>
											<IonLabel>
												<IonText
													style={{
														color: "var(--text-color-secondary)",
														fontSize: "0.9rem",
													}}
												>
													Draw Date
												</IonText>
											</IonLabel>
											<IonText
												style={{
													color: "var(--text-color-secondary)",
													fontSize: "0.9rem",
												}}
											>
												Dec. 12, 2025
											</IonText>
										</IonItem>
									</IonList>
								</IonCardContent>
							</IonCard>
						</div>
					)}

					<IonCard className="custom-card jackpot-card">
						<IonCardHeader>
							<IonCardTitle className="custom-card-title ion-text-center">
								🎰 JACKPOT 🎰
							</IonCardTitle>
						</IonCardHeader>
						<IonCardContent className="ion-text-center">
							<IonText color="warning">
								<h1
									style={{
										fontSize: "3.5rem",
										fontWeight: "900",
										margin: "0",
										background: "linear-gradient(135deg, #FFD700, #FFA500)",
										WebkitBackgroundClip: "text",
										WebkitTextFillColor: "transparent",
										textShadow: "0 4px 8px rgba(255, 215, 0, 0.3)",
									}}
								>
									{isJackpotLoading ? (
										<>
										 <IonSpinner name="crescent" />
										</>
									) : (
										`$ ${jackpot || "0"}`
									)}
								</h1>
							</IonText>
							<IonText>
								<p
									style={{
										color: "var(--text-color-secondary)",
										margin: "16px 0",
										fontSize: "1.1rem",
										fontWeight: "500",
									}}
								>{isJackpotLoading ? (
									<>
										<IonSpinner name="dots" />
									</>
								): (<>
									{numberOfTicketsSold || 0} / {maximumBets} Tickets Sold
									</>	
								)}
									
								</p>
							</IonText>
							<div className="progress-container">
								<div
									className="progress-bar"
									style={{ width: `${(numberOfTicketsSold || 0) / Number(maximumBets)}%` }}
								></div>
							</div>
							<IonText>
								<p
									style={{
										color: "var(--lottery-gold)",
										fontSize: "0.9rem",
										fontWeight: "600",
										marginTop: "8px",
									}}
								>
									Next Draw: When 10,000 tickets are sold!
								</p>
							</IonText>
						</IonCardContent>
					</IonCard>

					<IonCard className="custom-card">
						<IonCardHeader>
							<IonCardTitle className="custom-card-title">
								🎯 PLACE YOUR BET
							</IonCardTitle>
						</IonCardHeader>
						<IonCardContent>
							<DigitInput
								value={betNumber}
								onChange={setBetNumber}
							/>

							<IonButton
								className="custom-button bet-button"
								expand="block"
								onClick={handleOpen}
								disabled={placingBet}
								style={{ marginTop: "24px" }}
							>
								🎫 Buy Ticket - $0.50
							</IonButton>

							<div
								style={{
									marginTop: "16px",
									padding: "12px",
									background: "rgba(255, 215, 0, 0.1)",
									borderRadius: "8px",
									border: "1px solid rgba(255, 215, 0, 0.2)",
								}}
							>
								<IonText
									style={{ color: "var(--lottery-gold)", fontSize: "0.9rem" }}
								>
									💰 Instant $0.05 rebate + referral earnings on every ticket!
								</IonText>
							</div>
						</IonCardContent>
					</IonCard>
				</div>

				<IonModal
					isOpen={confirmationModal}
					onDidDismiss={() => setConfirmationModal(false)}
					initialBreakpoint={1}
				>
					<IonContent
						className="ion-padding"
						style={{
							"--background": "var(--background-color)",
						}}
					>
						<IonProgressBar value={progress}></IonProgressBar>

						<div style={{ padding: "8px" }}>
							<h2 style={{ color: "var(--lottery-gold)" }}>
								Confirm Transaction ✅
							</h2>
							<div style={{ color: "var(--lottery-gold)" }}>
								<p>Signed Hex: {signedHex}</p>
								{/* globalbetNumberState */}
								<p>Draw number: {draw}</p>
								<p>Bet number: {globalBetNumber}</p>
								<p>Referrer {referralUpline}</p>
								<p>Ticket Price: $ 0.5</p>
							</div>
						</div>

						<div style={{ display: "flex", gap: "12px" }}>
							<IonButton
								className="custom-button"
								expand="block"
								onClick={handleCancel}
								style={{
									flex: 1,
									"--background": "var(--lottery-crimson)",
								}}
							>
								Cancel
							</IonButton>

							<IonButton
								className="custom-button"
								expand="block"
								onClick={handleSubmit}
								style={{
									flex: 1,
									"--background": "var(--lottery-emerald)",
								}}
							>
								Confirm
							</IonButton>
						</div>
					</IonContent>
				</IonModal>

				<IonModal
					isOpen={isModalOpen}
					onDidDismiss={() => setIsModalOpen(false)}
					initialBreakpoint={0.5}
					breakpoints={[0, 0.5]}
					backdropBreakpoint={0.25}
				>
					<IonContent
						className="ion-padding"
						style={{ "--background": "var(--background-color)" }}
					>
						<div style={{ padding: "8px" }}>
							<h2 style={{ color: "var(--lottery-gold)" }}>Place Bet</h2>

							<IonSelect
								value={draw}
								onIonChange={(e) => setDraw(e.detail.value)}
								label="Draw number"
								labelPlacement="floating"
								fill="solid"
								className="dark-select"
							>
								<IonSelectOption value="1">10 AM Draw</IonSelectOption>
								<IonSelectOption value="2">10 PM Draw</IonSelectOption>
							</IonSelect>

							<IonButton
								className="custom-button"
								expand="block"
								onClick={handlePlaceBet}
								style={{
									marginTop: "24px",
									"--background": "var(--lottery-emerald)",
								}}
							>
								Place Bet
							</IonButton>
						</div>
					</IonContent>
				</IonModal>

				<IonModal
					isOpen={winnersModal}
					onDidDismiss={() => setWinnersModal(false)}
					initialBreakpoint={1}
				>
					<IonContent
						className="ion-padding"
						style={{
							"--background": "var(--background-color)",
						}}
					>

						<div style={{ padding: "8px"}}>
							<div style={{ display: "flex", justifyContent: "center" }}>
								<h2 style={{ color: "var(--lottery-gold)" }}>
									🏆 Winners 🏆
								</h2>
							</div>
						</div>

						<div
							className="fade-in"
							style={{ padding: "8px" }}
						>
							<IonCard
								className="custom-card"
								style={{ margin: "0 0 0 0" }}
							>
								<IonCardHeader>
									<IonCardTitle
										className="custom-card-title"
										style={{ display: "flex", alignItems: "center" }}
									>
										🎯 Draw # 1
										<IonBadge
											style={{
												background: "var(--gold-gradient)",
												color: "#000000",
												marginLeft: "auto", // pushes badge to the end
												fontWeight: "700",
												fontSize: "0.8rem",
											}}
										>
											JACKPOT ROLLED
										</IonBadge>
									</IonCardTitle>
								</IonCardHeader>
								<IonCardContent style={{ padding: "0" }}>
									<IonList
										lines="full"
										style={{ background: "transparent", padding: "0" }}
									>
										<IonItem
											style={
												{
													"--background": "transparent",
													"--border-color": "rgba(255, 215, 0, 0.2)",
													"--padding-start": "16px",
													"--inner-padding-end": "16px",
												} as any
											}
										>
											<IonLabel>
												<IonText
													style={{
														color: "var(--text-color-secondary)",
														fontSize: "0.9rem",
													}}
												>
													//Addresses here
												</IonText>
											</IonLabel>
										
										</IonItem>
									
						
									</IonList>
								</IonCardContent>
							</IonCard>
						</div>
						</IonContent>

						<IonFooter>
							<div style={{ display: "flex", gap: "12px", alignContent: "flex-end", background: "var(--background-color)",}}>
								<IonButton
									className="custom-button"
									expand="block"
									onClick={handleCloseWinnersModal}
									style={{
										flex: 1,
										"--background": "var(--lottery-crimson)",
									}}
								>
									Close
								</IonButton>
							</div>
						</IonFooter>
					
				</IonModal>
			</IonContent>
		</IonPage>
	);
};

export default DashboardPage;
