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
import { chevronDownCircleOutline } from "ionicons/icons";

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

	const { 
		walletAddress, 
		globalBetNumber, 
		setGlobalBetNumber, 
		referralUpline, 
		numberOfTicketsSold, 
		setNumberOfTicketsSold, 
		numberOfTicketsSold2,
		setNumberOfTicketsSold2,
		maximumBets, 
		setMaximumBets,
		draw,
		setDraw,
		winningNumber,
		setWinningNumber,
		winningNumber2,
		setWinningNumber2,
		jackpot,
		setJackpot,
		jackpot2,
		setJackpot2,
		winners,
		setWinners,
		winners2,
		setWinners2,
		drawStatus,
		setDrawStatus,
		drawStatus2,
		setDrawStatus2,
		isAfter10Am,
		setIsAfter10Am,
	} = useAppStore(); // Global states

	const [presentLoading, dismissLoading] = useIonLoading();
	const [presentToast] = useIonToast();
	const [isWinnerNumberLoading, setIsWinnerNumberLoading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [isJackpotLoading, setIsJackpotLoading] = useState(false)
	const [selectedDrawForModal, setSelectedDrawForModal] = useState<1 | 2>(1);
	const [betNumber, setBetNumber] = useState("");
	const [selectedSegment, setSelectedSegment] = useState<SegmentValue>("first");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [confirmationModal, setConfirmationModal] = useState(false);
	const [winnersModal, setWinnersModal] = useState(false)
	const [signedHex, setSignedHex] = useState("");

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

	const checkTime = () => {
		const now = new Date();
		const hours = now.getHours();
		const minutes = now.getMinutes();

		// Check if current time is >= 10:00 AM
		const isAfterTenAM = hours > 10 || (hours === 10 && minutes >= 0);
		setIsAfter10Am(isAfterTenAM);
	};

	const handleCancel = () => {
		window.history.replaceState({}, document.title, window.location.pathname);
		setConfirmationModal(false);
		setGlobalBetNumber(0);
	};


	const handleOpen = async () => {
		try {
			if (betNumber.trim().length !== 3) {
				presentToast({
					message: "Please enter a 3-digit number.",
					duration: 2000,
					color: "warning",
				});
				return;
			}
			await presentLoading({ message: "Checking draw status..." });
			await handleRefreshDraws({ detail: { complete: () => {} } } as CustomEvent);

			const currentDrawStatus = isAfter10Am ? drawStatus2 : drawStatus;

			if(currentDrawStatus !== 'Open') {
				presentToast({
					message: "The draw is not open for betting.",
					duration: 2000,
					color: "danger",
				});
				return;
			}
			
			setIsModalOpen(true);
		} catch (error) {
			presentToast({
				message: `Error: ${error instanceof Error ? error.message : String(error)}`,
				duration: 3000,
				color: "danger",
			});
		} finally {
			dismissLoading();
		}
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

	const handleOpenWinnersModal = (drawIndex: 1 | 2) => {
		setSelectedDrawForModal(drawIndex)
		setWinnersModal(true)
	}

	const handleCloseWinnersModal = () => {
        setWinnersModal(false)
    }

    const fetchDraws = async () => {
        try {
            setIsWinnerNumberLoading(true);
            setIsJackpotLoading(true)
            const result = await lotteryService.getDraws();

            if(!result.success || !result.draws) {
                presentToast({ message: `${result.message}`, duration: 3000, color: "danger", });
                return;
            }

            const draws = result.draws;
            const draw1 = draws[0];
            const draw2 = draws[1];

            setIsWinnerNumberLoading(false);
            setIsJackpotLoading(false)

            if (draw1) {
                setJackpot(draw1.jackpot || '0')
                setNumberOfTicketsSold(draw1.bets?.length || 0)
                setWinningNumber(draw1.winningNumber || 'N/A'); 
                setWinners(draw1.winners || []); 
				setDrawStatus(draw1.status || 'Close');
            }

            if (draw2) {
                setJackpot2(draw2.jackpot || '0')
				setNumberOfTicketsSold2(draw2.bets?.length || 0)
                setWinningNumber2(draw2.winningNumber || 'N/A');
                setWinners2(draw2.winners || []);
				setDrawStatus2(draw2.status || 'Close');
            }

        } catch (error) {
            presentToast({ message: `${error}`, duration: 3000, color: "danger", });
            setWinningNumber('N/A')
            setWinningNumber2('N/A')
            setIsWinnerNumberLoading(false)
            setIsJackpotLoading(false)
            setWinners([]); 
            setWinners2([]);
        }
    };

    const fetchLotterySetup = async () => {
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

	const handleRefresh = async (event: CustomEvent) => {
		// Force refresh all data when user pulls down
		try {
			await Promise.all([
				refetch(),
				fetchDraws(),
				fetchLotterySetup()
			]);
		} catch (error) {
			console.error('Refresh failed:', error);
		} finally {
			event.detail.complete();
		}
	};

	const handleRefreshDraws = async (event: CustomEvent) => {
		// Force refresh all data when user pulls down
		try {
			await Promise.all([
				fetchDraws(),
			]);
		} catch (error) {
			presentToast({
				message: `Refresh failed: ${error}`,
				duration: 3000,
				color: "danger",
			});
		} finally {
			event.detail.complete();
		}
	};

   useEffect(() => {
        // Only fetch if we don't have data in the store
        if (!jackpot) {
            fetchDraws();
        }
    }, []);

    useEffect(() => {
        // Only fetch if we don't have data in the store
        if (!maximumBets) {
            fetchLotterySetup()
        }
    }, [])

	useEffect(() => {
		// Check time once on mount
		checkTime();
	}, []);

	const handleSubmit = async () => {
		presentLoading("Submitting transaction...");
		window.history.replaceState({}, document.title, window.location.pathname);
		const payload = {
				signed_hex: signedHex,
				draw_number: draw || '1',
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
				<div className="fade-in" style={{ 
					padding: "16px 8px", 
					display: "flex", 
					alignItems: "center", 
					justifyContent: "center",
					gap: "12px",
					background: (isAfter10Am ? drawStatus2 : drawStatus) === 'Open' 
						? "rgba(255, 215, 0, 0.05)" 
						: (isAfter10Am ? drawStatus2 : drawStatus) === 'Processing'
						? "rgba(255, 165, 0, 0.05)"
						: "rgba(220, 20, 60, 0.05)",
					borderTop: (isAfter10Am ? drawStatus2 : drawStatus) === 'Open'
						? "1px solid rgba(255, 215, 0, 0.2)"
						: (isAfter10Am ? drawStatus2 : drawStatus) === 'Processing'
						? "1px solid rgba(255, 165, 0, 0.2)"
						: "1px solid rgba(220, 20, 60, 0.2)",
					borderBottom: (isAfter10Am ? drawStatus2 : drawStatus) === 'Open'
						? "1px solid rgba(255, 215, 0, 0.2)"
						: (isAfter10Am ? drawStatus2 : drawStatus) === 'Processing'
						? "1px solid rgba(255, 165, 0, 0.2)"
						: "1px solid rgba(220, 20, 60, 0.2)"
				}}>
					<div style={{ 
						width: "10px", 
						height: "10px", 
						borderRadius: "50%", 
						background: (isAfter10Am ? drawStatus2 : drawStatus) === 'Open'
							? "var(--lottery-emerald)"
							: (isAfter10Am ? drawStatus2 : drawStatus) === 'Processing'
							? "var(--ion-color-warning)"
							: "var(--lottery-crimson)",
						boxShadow: (isAfter10Am ? drawStatus2 : drawStatus) === 'Open'
							? "0 0 12px var(--lottery-emerald)"
							: (isAfter10Am ? drawStatus2 : drawStatus) === 'Processing'
							? "0 0 12px var(--ion-color-warning)"
							: "0 0 12px var(--lottery-crimson)",
						animation: (isAfter10Am ? drawStatus2 : drawStatus) === 'Processing' ? "pulse 2s infinite" : "pulse 2s infinite"
					}} />
					<IonText style={{ 
						color: (isAfter10Am ? drawStatus2 : drawStatus) === 'Open'
							? "var(--lottery-emerald)"
							: (isAfter10Am ? drawStatus2 : drawStatus) === 'Processing'
							? "var(--ion-color-warning)"
							: "var(--lottery-crimson)", 
						fontWeight: "700", 
						fontSize: "0.95rem",
						letterSpacing: "0.5px"
					}}>
						{(isAfter10Am ? drawStatus2 : drawStatus) === 'Open' 
							? `${isAfter10Am ? '10 PM' : '10 AM'} DRAW ACTIVE • BETS OPEN`
							: (isAfter10Am ? drawStatus2 : drawStatus) === 'Processing'
							? `${isAfter10Am ? '10 PM' : '10 AM'} DRAW PROCESSING • PLEASE WAIT`
							: `${isAfter10Am ? '10 PM' : '10 AM'} DRAW CLOSED • BETS CLOSED`}
					</IonText>
				</div>
				
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
													(winningNumber || '0')
														.toString()
														.padEnd(3, "0")		
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
												<IonChip outline={true} color="success" onClick={() => handleOpenWinnersModal(1)}>See winners</IonChip>
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
													 `$ ${jackpot|| "0"}`
												)}
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
													(winningNumber2 || '0')
														.toString()
  														.padEnd(3, "0")		
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
												<IonChip outline={true} color="success" onClick={() => handleOpenWinnersModal(2)}>See winners</IonChip>
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
													 `$ ${jackpot2 || "0"}`
												)}
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
										`$ ${isAfter10Am ? jackpot2 : jackpot || "0"}`
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
									{isAfter10Am ? numberOfTicketsSold2 : numberOfTicketsSold || 0} / {maximumBets} Tickets Sold
									</>	
								)}
									
								</p>
							</IonText>
							<div className="progress-container">
								<div
									className="progress-bar"
									style={{ width: `${((isAfter10Am ? numberOfTicketsSold2 : numberOfTicketsSold) || 0) / Number(maximumBets)}%` }}
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
									{isAfter10Am ? 'Next Draw: 10 PM' : 'Next Draw: 10 AM'} - Hurry up and buy your tickets!	
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
					onDidDismiss={handleCancel}
					initialBreakpoint={1}
				>
					<IonContent
						className="ion-padding"
						style={{ "--background": "var(--background-color)" }}
					>
						<IonProgressBar value={progress} color="warning" style={{ marginBottom: 16 }} />

						<div style={{ padding: "8px" }}>
							<h2 style={{ color: "var(--lottery-gold)", marginBottom: 8 }}>
								Confirm Transaction
								<span role="img" aria-label="check"> ✅</span>
							</h2>
							<IonList lines="none" style={{ background: "transparent" }}>
								<IonItem style={{ "--background": "transparent" }}>
									<IonLabel>
										<IonText color="medium" style={{ fontWeight: 500 }}>Draw Number:</IonText>
									</IonLabel>
									<IonText color="primary">{draw}</IonText>
								</IonItem>
								<IonItem style={{ "--background": "transparent" }}>
									<IonLabel>
										<IonText color="medium" style={{ fontWeight: 500 }}>Bet Number:</IonText>
									</IonLabel>
									<IonText color="primary">{globalBetNumber}</IonText>
								</IonItem>
								<IonItem style={{ "--background": "transparent" }}>
									<IonLabel>
										<IonText color="medium" style={{ fontWeight: 500 }}>Referrer:</IonText>
									</IonLabel>
									<IonText color="primary">
										{referralUpline
											? `${referralUpline.substring(0, 6)}...${referralUpline.substring(referralUpline.length - 4)}`
											: "N/A"}
									</IonText>
								</IonItem>
								<IonItem style={{ "--background": "transparent" }}>
									<IonLabel>
										<IonText color="medium" style={{ fontWeight: 500 }}>Ticket Price:</IonText>
									</IonLabel>
									<IonText color="success">$0.50</IonText>
								</IonItem>
								<IonItem style={{ "--background": "transparent" }}>
									<IonLabel>
										<IonText color="medium" style={{ fontWeight: 500 }}>Signed Hex:</IonText>
									</IonLabel>
									<IonText
										style={{
											wordBreak: "break-all",
											fontSize: "0.85rem",
											opacity: 0.8,
										}}
									>
										{signedHex ? signedHex.slice(0, 16) + "..." : "N/A"}
									</IonText>
								</IonItem>
							</IonList>
						</div>
					</IonContent>
					<IonFooter>
						<div style={{ display: "flex", gap: "12px", alignContent: "flex-end", background: "var(--background-color)", padding: "16px" }}>
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
					</IonFooter>
				</IonModal>

				<IonModal
					isOpen={isModalOpen}
					onDidDismiss={() => setIsModalOpen(false)}
					initialBreakpoint={0.5}
				>
					<IonContent
						className="ion-padding"
						style={{ "--background": "var(--background-color)" }}
					>
						<div style={{ padding: "8px" }}>
							<h2 style={{ color: "var(--lottery-gold)", marginBottom: 16, textAlign: "center" }}>
								Place Your Bet
							</h2>
							<IonList lines="none" style={{ background: "transparent" }}>
								<IonItem style={{ "--background": "transparent" }}>
									<IonLabel position="stacked" style={{ color: "var(--lottery-gold)", fontWeight: 600 }}>
										Select Draw
									</IonLabel>
									<IonSelect
										value={draw}
										onIonChange={(e) => setDraw(e.detail.value)}
										placeholder="Choose draw"
										fill="solid"
										className="dark-select"
										style={{ width: "100%" }}
									>
										<IonSelectOption value="1">10 AM Draw</IonSelectOption>
										<IonSelectOption value="2">10 PM Draw</IonSelectOption>
									</IonSelect>
								</IonItem>
								<IonItem style={{ "--background": "transparent", marginTop: 16 }}>
									<IonLabel position="stacked" style={{ color: "var(--lottery-gold)", fontWeight: 600 }}>
										Your Bet Number
									</IonLabel>
									<IonText style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--ion-color-primary)" }}>
										{betNumber || <span style={{ opacity: 0.5 }}>---</span>}
									</IonText>
								</IonItem>
							</IonList>
							<IonButton
								className="custom-button"
								expand="block"
								onClick={handlePlaceBet}
								disabled={!betNumber || betNumber.length !== 3}
								style={{
									marginTop: "48px",
									"--background": "var(--lottery-emerald)",
									fontWeight: 700,
									fontSize: "1.1rem",
								}}
							>
								{placingBet ? <IonSpinner name="crescent" /> : "Place Bet"}
							</IonButton>
							<IonText style={{ display: "block", marginTop: 16, color: "var(--text-color-secondary)", fontSize: "0.95rem", textAlign: "center" }}>
								Each ticket costs <b>$0.50</b>. Good luck!
							</IonText>
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
										🎯 Draw # {selectedDrawForModal}
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
										{(selectedDrawForModal === 1 ? winners : winners2).length > 0 ? (
											(selectedDrawForModal === 1 ? winners : winners2).map((winner, index) => (
												<IonItem
													key={index}
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
															<a href={`https://node.xode.net/polkadot/account/${winner.bettor}`} target="_blank" rel="noopener noreferrer">
																{winner.bettor
																	? `${winner.bettor.substring(0, 6)}...${winner.bettor.substring(winner.bettor.length - 4)}`
																	: ""}
															</a>
														</IonText>
													</IonLabel>
													<IonText
														style={{
															color: "var(--lottery-gold)",
															fontWeight: "600",
															fontSize: "0.9rem",
														}}
													>
														${winner.bettorShare || "0"}
													</IonText>
												</IonItem>
											))
										) : (
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
															fontStyle: "italic",
															textAlign: "center",
															display: "block",
														}}
													>
														No winners yet
													</IonText>
												</IonLabel>
											</IonItem>
										)}
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
