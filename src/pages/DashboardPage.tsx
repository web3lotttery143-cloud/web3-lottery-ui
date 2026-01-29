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
	IonIcon,
	IonPopover
} from "@ionic/react";
import { SaveBetDto } from "../models/saveBet.model";
import React, { useState, useEffect } from "react";
import DigitInput from "../components/DigitInput";
import { PLACE_BET } from "../graphql/queries";
import xteriumService from "../services/xteriumService";
import useAppStore from "../store/useAppStore";
import lotteryService from "../services/lotteryService";
import walletService from "../services/walletService";
import { execute } from "graphql";
import { walletOutline, chevronDownCircleOutline, terminal, cashOutline, checkmarkOutline } from "ionicons/icons";
import { VITE_BET_AMOUNT, VITE_OPERATOR_ADDRESS } from "../services/constants";
import "../styles/marquee.css";

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
        availableWallets,
        connectWallet,
		setIsAdmin,
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
		setRebate,
		setRebate2,
		setAffiliateEarnings,
		setAffiliateEarnings2,
		isSubmitting,
		setIsSubmitting,
		isOverrideMode,
		setExpectedWinningNumber,
		expectedWinningNumber,
		jackpotAmount,
		setJackpotAmount,
		isAddJackpotMode,
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
	const [overRideModal, setOverRideModal] = useState(false);
	const [addJackpotModal, setAddJackpotModal] = useState(false);
	const [winnersModal, setWinnersModal] = useState(false)
	const [signedHex, setSignedHex] = useState("");
	const [drawStatusLoading, setDrawStatusLoading] = useState(false);
	const [isSubmittingModalMinimized, setIsSubmittingModalMinimized] = useState(false);
	//const [isSubmitting, setIsSubmitting] = useState(false);

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
		try {
			setDrawStatusLoading(true);
			const now = new Date();
			const hours = now.getHours();
			const minutes = now.getMinutes();

			// Check if current time is >= 1:00 PM
			const isAfterTenAM = hours > 13 || (hours === 13 && minutes >= 0);
			setIsAfter10Am(isAfterTenAM); //testingDrawNumber

			if (isAfterTenAM) {
				setDraw("2");
				setSelectedSegment("second")
			} else {
				setDraw("1");
				setSelectedSegment("first")
			}
		} catch (error) {
			presentToast({
				message: 'Failed to check time',
				duration: 2000,
				color: 'danger',
			});
		} finally {
			setDrawStatusLoading(false);
		}
	};

	const handleCancel = () => { // Cleanup
		window.history.replaceState({}, document.title, window.location.pathname);
		setConfirmationModal(false);
		setOverRideModal(false)
		setAddJackpotModal(false)
		setGlobalBetNumber(0);
		setExpectedWinningNumber(0);
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
			const signed_hex =  walletService.signTransaction(
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
				const rawJackpot = Number(
					String(draw1.jackpot).replace(/,/g, '')
					);

					setJackpot(
					isNaN(rawJackpot)
						? '0.0000'
						: (rawJackpot / 1_000_000).toFixed(4)
					);   
				setNumberOfTicketsSold(draw1.bets?.length || 0)
                setWinningNumber(draw1.winningNumber || 'N/A'); 
                setWinners(draw1.winners || []); 
				setDrawStatus(draw1.status || 'Close');
				
				const rawRebate = Number(
					String(draw1.rebate).replace(/,/g, '')
					);
				setRebate(
					isNaN(rawRebate)
						? '0.0000'
						: (rawRebate / 1_000_000).toFixed(4)
				);
				const matchingWinner = draw1.winners?.find(
					(winner: any) => winner.bettor === walletAddress
				);
				// if (matchingWinner) {
				// 	setAffiliateEarnings(matchingWinner.bettorShare || '0');
				// } else {
				// 	setAffiliateEarnings('0');
				// }
            }

            if (draw2) {
                const rawJackpot = Number(
					String(draw2.jackpot).replace(/,/g, '')
					);

					setJackpot2(
					isNaN(rawJackpot)
						? '0.0000'
						: (rawJackpot / 1_000_000).toFixed(4)
					);         
				setNumberOfTicketsSold2(draw2.bets?.length || 0)
                setWinningNumber2(draw2.winningNumber || 'N/A');
                setWinners2(draw2.winners || []);
				setDrawStatus2(draw2.status || 'Close');
				const rawRebate = Number(
					String(draw2.rebate).replace(/,/g, '')
					);
				setRebate2(
					isNaN(rawRebate)
						? '0.0000'
						: (rawRebate / 1_000_000).toFixed(4)
				);
				const matchingWinner = draw2.winners?.find(
					(winner: any) => winner.bettor === walletAddress
				);
				// if (matchingWinner) {
				// 	setAffiliateEarnings2(matchingWinner.bettorShare || '0');
				// } else {
				// 	setAffiliateEarnings2('0');
				// }
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
				fetchLotterySetup(),
				checkTime()
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
				checkTime()
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

	const handleOverride = async () => {
		presentLoading({ message: "Executing override..." });
		setOverRideModal(false)
		window.history.replaceState({}, document.title, window.location.pathname);
		const executeOverride = await lotteryService.executeOverride(signedHex)
			
		try {
			if(!executeOverride.success) {
				presentToast({ message: `${executeOverride.message}`, duration: 3000, color: "danger", });	
				return
			}

			presentToast({ message: `Override executed: ${executeOverride.message}`, duration: 5000, color: "success", });
		} catch (error) {
			presentToast({ message: `${executeOverride.message}`, duration: 3000, color: "danger", });	
		} finally {
			dismissLoading();
		}
	}

	const handleAddJackpot = async () => { // add DTO (signed_hex, draw_number, jackpot)
		presentLoading({ message: "Adding jackpot..." });
		setAddJackpotModal(false)
		window.history.replaceState({}, document.title, window.location.pathname);

		const drawNumber = Number(draw)
		const payload = {
			signed_hex: signedHex,
			draw_number: drawNumber,
			jackpot_amount: jackpotAmount,
		}
		const executeAddJackpot = await lotteryService.executeDrawJackpot(payload)
		
		try {
			if(!executeAddJackpot.success) {
				presentToast({ message: `Failed to add jackpot ${executeAddJackpot.message}`, duration: 3000, color: "danger", });	
				return
			}

			presentToast({ message: `Jackpot added: ${executeAddJackpot.message}`, duration: 5000, color: "success", });
		} catch (error) {
			presentToast({ message: `Failed to add jackpot ${error}`, duration: 3000, color: "danger", });	
		} finally {
			dismissLoading();
		}
	}

	const handleSubmit = async () => {
		setIsSubmitting(true);
		setConfirmationModal(false);
		window.history.replaceState({}, document.title, window.location.pathname);
		const payload = {
				signed_hex: signedHex,
				draw_number: draw || '1',
				bet_number: globalBetNumber,
				bettor: walletAddress!,
				upline: referralUpline || "",
			};

			const executeBet = await lotteryService.executeBet(payload);

		try {
			if(!executeBet.success) {
				throw new Error
			}

			const betPayload: SaveBetDto = {
				member_address: walletAddress!,
				bet: {
					bet_number: globalBetNumber.toString(),
					bet_amount: VITE_BET_AMOUNT|| '0.5',
					transaction_hash: executeBet.message || '',
					draw_number: draw || '1',
				}
			}
			const saveBet = await walletService.saveBets(betPayload)
			presentToast({
				message: `Transaction completed: ${executeBet.message}`,
				duration: 5000,
				color: "success",
			});
			
		} catch (error) {
			presentToast({
				message: `${executeBet.message}`,
				duration: 10000,
				color: "danger",
			});
		} finally {
			setIsSubmitting(false);
			fetchDraws(),
			fetchLotterySetup()
		}
	};

	useEffect(() => {
		const run = async () => {
			try {
				const response = await walletService.checkSignedTxFromUrl();

				if (!response.success) return

				if(isOverrideMode){
					setOverRideModal(true);
				} else if(isAddJackpotMode) {
					setAddJackpotModal(true);
				} else {
					setConfirmationModal(true);
				}

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

		const duration = 12000;
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

	return (
		<IonPage>
			<IonHeader translucent={true}>
				<IonToolbar>
					<IonTitle>🛖 Dashboard</IonTitle>
					{walletAddress && availableWallets && availableWallets.length > 1 ? (
						<div slot="end" className="ion-padding-end">
							<div style={{
								display: 'flex',
								alignItems: 'center',
								background: 'transparent',
								border: '1px solid rgba(255, 215, 0, 0.4)',
								borderRadius: '20px',
								height: '36px',
								padding: '0 8px 0 12px',
								transition: 'all 0.3s ease'
							}}>
								<IonIcon icon={walletOutline} style={{ color: 'var(--lottery-gold)', marginRight: '4px', fontSize: '18px' }} />
								<IonSelect 
									value={walletAddress} 
								
									onIonChange={e => {
										const address = e.detail.value;
										connectWallet(address)
										
										if(address == VITE_OPERATOR_ADDRESS) {
											setIsAdmin(true)
										} else {
											setIsAdmin(false)
										}
									}}
									interfaceOptions={{ cssClass: 'wallet-select-popover' }}
								
									style={{ 
										fontSize: "0.9rem", 
										fontWeight: '700',
										color: 'white',
										maxWidth: '160px',
										'--padding-start': '4px',
										'--padding-end': '0',
										'--placeholder-opacity': '1',
										minHeight: 'auto'
									}}
									
								>
									{availableWallets.map((wallet) => (
										<IonSelectOption key={wallet.address} value={wallet.address}>
											{wallet.label}
										</IonSelectOption>
									))}
								</IonSelect>
							</div>
						</div>
					) : walletAddress && (
						<div slot="end" className="ion-padding-end" style={{ display: 'flex', alignItems: 'center' }}>
							<div style={{
								display: 'flex',
								alignItems: 'center',
								background: 'transparent',
								border: '1px solid rgba(255, 215, 0, 0.3)',
								borderRadius: '20px',
								padding: '6px 16px',
							}}>
								<IonIcon icon={walletOutline} style={{ color: 'var(--lottery-gold)', marginRight: '8px', fontSize: '16px' }} />
								<IonLabel style={{ 
									fontSize: "0.85rem", 
									color: 'var(--lottery-gold)', 
									fontWeight: '600', 
									margin: 0,
									letterSpacing: '0.5px',
									fontFamily: 'monospace'
								}}>
									{walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
								</IonLabel>
							</div>
						</div>
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
					position: "sticky",
					top: 0,
					zIndex: 10,
					padding: "16px 8px", 
					display: "flex", 
					alignItems: "center", 
					justifyContent: "center",
					gap: "12px",
					background: drawStatusLoading
						? "rgba(128, 128, 128, 0.15)"
						: (isAfter10Am ? drawStatus2 : drawStatus) === 'Open' 
						? "rgba(46, 213, 115, 0.15)" 
						: (isAfter10Am ? drawStatus2 : drawStatus) === 'Processing'
						? "rgba(255, 165, 0, 0.15)"
						: "rgba(220, 20, 60, 0.15)",
					borderTop: drawStatusLoading
						? "1px solid rgba(128, 128, 128, 0.2)"
						: (isAfter10Am ? drawStatus2 : drawStatus) === 'Open'
						? "1px solid rgba(46, 213, 115, 0.3)"
						: (isAfter10Am ? drawStatus2 : drawStatus) === 'Processing'
						? "1px solid rgba(255, 165, 0, 0.2)"
						: "1px solid rgba(220, 20, 60, 0.2)",
					borderBottom: drawStatusLoading
						? "1px solid rgba(128, 128, 128, 0.2)"
						: (isAfter10Am ? drawStatus2 : drawStatus) === 'Open'
						? "1px solid rgba(46, 213, 115, 0.3)"
						: (isAfter10Am ? drawStatus2 : drawStatus) === 'Processing'
						? "1px solid rgba(255, 165, 0, 0.2)"
						: "1px solid rgba(220, 20, 60, 0.2)",
					backdropFilter: "blur(10px)"
				}}>
					{drawStatusLoading ? (
						<>
							<IonSpinner name="crescent" />
							<IonText style={{ 
								color: "var(--text-color-secondary)", 
								fontWeight: "700", 
								fontSize: "0.95rem",
								letterSpacing: "0.5px"
							}}>
								LOADING DRAW STATUS...
							</IonText>
						</>
					) : (
						<>
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
									? `${isAfter10Am ? '9 PM' : '1 PM'} DRAW ACTIVE • BETS OPEN`
									: (isAfter10Am ? drawStatus2 : drawStatus) === 'Processing'
									? `${isAfter10Am ? '9 PM' : '1 PM'} DRAW PROCESSING • PLEASE WAIT`
									: `${isAfter10Am ? '9 PM' : '1 PM'} DRAW CLOSED • BETS CLOSED`}
							</IonText>
						</>
					)}
				</div>
				
				<div className="fade-in">
					<IonSegment
						value={selectedSegment}
						onIonChange={(e) => setSelectedSegment(e.detail.value!)}
						mode="ios"
						style={{ marginTop: "10px"}}
					>
						<IonSegmentButton value="first">
							<IonLabel color="primary">1 PM Draw</IonLabel>
						</IonSegmentButton>
						<IonSegmentButton value="second">
							<IonLabel color="primary">9 PM Draw</IonLabel>
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
												) : drawStatus === "Processing" ? (
													<IonText
														style={{
															color: "var(--ion-color-warning)",
															fontSize: "0.9rem",
															fontStyle: "italic",
														}}
													>
														Processing...
													</IonText>
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
													Contract Address
												</IonText>
											</IonLabel>
											<IonText
												style={{
													color: "var(--lottery-gold)",
													fontWeight: "700",
													fontSize: "1.1rem",
												}}
											>
												<a href={`https://node.xode.net/xode-polkadot/account/XqBiR36SHdpKJRLHPnC5mqY7QXFqwixsHP2nhSSoyjJv4hh4C?fbclid=IwY2xjawPedOpleHRuA2FlbQIxMQBzcnRjBmFwcF9pZAEwAAEeQzBSdLKrSEzow6AxgncWQBC1Y8fmnsfFQng5KXkx3llSFnDJUYiVLIhWTrA_aem_hkI_6w1ELx5xfPGPluqmYw`} target='_blank'>
													XqBiR36S....
												</a>
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
												) : drawStatus2 === "Processing" ? (
													<IonText
														style={{
															color: "var(--ion-color-warning)",
															fontSize: "0.9rem",
															fontStyle: "italic",
														}}
													>
														Processing...
													</IonText>
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
													Contract Address
												</IonText>
											</IonLabel>
											<IonText
												style={{
													color: "var(--lottery-gold)",
													fontWeight: "700",
													fontSize: "1.1rem",
												}}
											>
												<a href={`https://node.xode.net/xode-polkadot/account/XqBiR36SHdpKJRLHPnC5mqY7QXFqwixsHP2nhSSoyjJv4hh4C?fbclid=IwY2xjawPedOpleHRuA2FlbQIxMQBzcnRjBmFwcF9pZAEwAAEeQzBSdLKrSEzow6AxgncWQBC1Y8fmnsfFQng5KXkx3llSFnDJUYiVLIhWTrA_aem_hkI_6w1ELx5xfPGPluqmYw`} target='_blank'>
													XqBiR36S....
												</a>
											</IonText>
										</IonItem>
									</IonList>
								</IonCardContent>
							</IonCard>
						</div>
					)}

					<div className="marquee-container">
						<div className="marquee-content">
							<span>📢 1 PM Draw opens at 6 AM and closes at 12 PM • 9 PM Draw
							opens at 2 PM and closes at 8 PM • Good luck! 🎰 </span>
							<span aria-hidden="true">📢 1 PM Draw opens at 6 AM and closes at 12 PM • 9 PM Draw
							opens at 2 PM and closes at 8 PM • Good luck! 🎰 </span>
						</div>
					</div>

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
										fontSize: "3.2rem",
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
									style={{ width: `${Number(maximumBets) > 0 ? (((isAfter10Am ? numberOfTicketsSold2 : numberOfTicketsSold) || 0) / Number(maximumBets)) * 100 : 0}%` }}
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
									{isAfter10Am ? 'Next Draw: 9 PM' : 'Next Draw: 1 PM'} - Hurry up and buy your tickets!	
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
								disabled={placingBet || isSubmitting || isOverrideMode || isAddJackpotMode}
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
					<IonContent className="ion-padding" style={{ "--background": "var(--background-color)" }}>
						<IonProgressBar value={progress} color="warning" style={{ marginBottom: 16 }} />
						<div style={{ padding: "16px", textAlign: "center" }}>
							<div style={{
								background: "rgba(46, 213, 115, 0.1)",
								borderRadius: "50%",
								width: "80px",
								height: "80px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								margin: "0 auto 16px auto",
								border: "2px solid var(--lottery-emerald)"
							}}>
								<IonIcon icon={checkmarkOutline} style={{ fontSize: "40px", color: "var(--lottery-emerald)" }} />
							</div>
							
							<h2 style={{ color: "var(--lottery-emerald)", fontWeight: "900", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
							 CONFIRM TRANSACTION
							</h2>
							<p style={{ color: "var(--text-color-secondary)", marginBottom: "24px", fontSize: "0.95rem" }}>
								Review your bet details before confirming.
							</p>

							<div style={{ 
								background: "linear-gradient(180deg, rgba(20, 20, 20, 0.8) 0%, rgba(30, 30, 30, 0.8) 100%)", 
								borderRadius: "16px", 
								padding: "20px",
								border: "1px solid rgba(46, 213, 115, 0.3)",
								marginBottom: "24px",
								boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
							}}>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
									<IonText color="medium" style={{ fontSize: "0.9rem", fontWeight: "500" }}>
										Draw Number
									</IonText>
									<IonBadge color="primary" style={{ fontSize: "1rem", padding: "6px 12px" }}>
										#{draw}
									</IonBadge>
								</div>

								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
									<IonText color="medium" style={{ fontSize: "0.9rem", fontWeight: "500" }}>
										Bet Number
									</IonText>
									<IonText style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--ion-color-primary)" }}>
										{globalBetNumber}
									</IonText>
								</div>

								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
									<IonText color="medium" style={{ fontSize: "0.9rem", fontWeight: "500" }}>
										Referrer
									</IonText>
									<IonText style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-color-secondary)" }}>
										{referralUpline
											? `${referralUpline.substring(0, 6)}...${referralUpline.substring(referralUpline.length - 4)}`
											: "N/A"}
									</IonText>
								</div>

								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
									<IonText color="medium" style={{ fontSize: "0.9rem", fontWeight: "500" }}>
										Ticket Price
									</IonText>
									<IonText style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--lottery-emerald)" }}>
										$0.50
									</IonText>
								</div>

								<div style={{ marginTop: "20px" }}>
									<IonText color="medium" style={{ fontSize: "0.75rem", display: "block", marginBottom: "6px", textAlign: "left" }}>
										Transaction Signature (Hex)
									</IonText>
									<div style={{
										background: "rgba(0,0,0,0.5)",
										padding: "8px",
										borderRadius: "4px",
										textAlign: "left"
									}}>
										<IonText color="light" style={{ 
											fontSize: "0.75rem", 
											fontFamily: "monospace",
											wordBreak: "break-all",
											opacity: 0.7,
											display: "block",
											lineHeight: "1.4"
										}}>
											{signedHex ? signedHex.slice(0, 32) + "..." : "N/A"}
										</IonText>
									</div>
								</div>
							</div>
						</div>
					</IonContent>
					<IonFooter>
						<div style={{ display: "flex", gap: "12px", alignContent: "flex-end", background: "var(--background-color)", padding: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
							<IonButton
								fill="outline"
								color="medium"
								expand="block"
								onClick={handleCancel}
								style={{
									flex: 1,
									fontWeight: "600"
								}}
							>
								Cancel
							</IonButton>

							<IonButton
								color="success"
								expand="block"
								onClick={handleSubmit}
								style={{
									flex: 1,
									fontWeight: "bold",
									"--box-shadow": "0 4px 12px rgba(46, 213, 115, 0.4)"
								}}
							>
								CONFIRM
							</IonButton>
						</div>
					</IonFooter>
				</IonModal>

				<IonModal
					isOpen={overRideModal}
					onDidDismiss={handleCancel}
					initialBreakpoint={1}		
				>
					<IonContent className="ion-padding" style={{ "--background": "var(--background-color)" }}>
						<div style={{ padding: "16px", textAlign: "center" }}>
							<div style={{
								background: "rgba(220, 20, 60, 0.1)",
								borderRadius: "50%",
								width: "80px",
								height: "80px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								margin: "0 auto 16px auto",
								border: "2px solid var(--lottery-crimson)"
							}}>
								<IonIcon icon={terminal} style={{ fontSize: "40px", color: "var(--lottery-crimson)" }} />
							</div>
							
							<h2 style={{ color: "var(--lottery-crimson)", fontWeight: "900", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
								⚠️ SYSTEM OVERRIDE
							</h2>
							<p style={{ color: "var(--text-color-secondary)", marginBottom: "24px", fontSize: "0.95rem" }}>
								You are about to manually force a winning number. <br/>
								<span style={{color: "var(--ion-color-warning)", fontWeight: "bold"}}>This action cannot be undone.</span>
							</p>

							<div style={{ 
								background: "linear-gradient(180deg, rgba(20, 20, 20, 0.8) 0%, rgba(30, 30, 30, 0.8) 100%)", 
								borderRadius: "16px", 
								padding: "20px",
								border: "1px solid rgba(220, 20, 60, 0.3)",
								marginBottom: "24px",
								boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
							}}>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
									<IonText color="medium" style={{ fontSize: "0.9rem", fontWeight: "500" }}>
										Target Draw
									</IonText>
									<IonBadge color="danger" style={{ fontSize: "1rem", padding: "6px 12px" }}>
										#{draw}
									</IonBadge>
								</div>
								
								<div style={{ textAlign: "center", padding: "10px 0" }}>
									<IonText color="medium" style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>
										Forcing Winning Number
									</IonText>
									<div style={{ 
										background: "rgba(0,0,0,0.3)", 
										borderRadius: "8px", 
										padding: "12px",
										border: "1px dashed var(--lottery-crimson)"
									}}>
										<IonText style={{ 
											fontSize: "3rem", 
											fontWeight: "900", 
											color: "var(--lottery-crimson)",
											letterSpacing: "8px",
											textShadow: "0 0 20px rgba(220, 20, 60, 0.3)"
										}}>
											{expectedWinningNumber || "---"}
										</IonText>
									</div>
								</div>

								<div style={{ marginTop: "20px" }}>
									<IonText color="medium" style={{ fontSize: "0.75rem", display: "block", marginBottom: "6px", textAlign: "left" }}>
										Transaction Signature (Hex)
									</IonText>
									<div style={{
										background: "rgba(0,0,0,0.5)",
										padding: "8px",
										borderRadius: "4px",
										textAlign: "left"
									}}>
										<IonText color="light" style={{ 
											fontSize: "0.75rem", 
											fontFamily: "monospace",
											wordBreak: "break-all",
											opacity: 0.7,
											display: "block",
											lineHeight: "1.4"
										}}>
											{signedHex ? signedHex.slice(0, 32) + "..." : "N/A"}
										</IonText>
									</div>
								</div>
							</div>
						</div>
					</IonContent>
					<IonFooter>
						<div style={{ display: "flex", gap: "12px", alignContent: "flex-end", background: "var(--background-color)", padding: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
							<IonButton
								fill="outline"
								color="medium"
								expand="block"
								onClick={handleCancel}
								style={{
									flex: 1,
									fontWeight: "600"
								}}
							>
								Cancel
							</IonButton>

							<IonButton
								color="danger"
								expand="block"
								onClick={handleOverride}
								style={{
									flex: 1,
									fontWeight: "bold",
									"--box-shadow": "0 4px 12px rgba(220, 20, 60, 0.4)"
								}}
							>
								<IonIcon icon={terminal} slot="start" />
								EXECUTE OVERRIDE
							</IonButton>
						</div>
					</IonFooter>
				</IonModal>



				<IonModal
					isOpen={isModalOpen}
					onDidDismiss={() => setIsModalOpen(false)}
					initialBreakpoint={0.6}
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
										Draw Schedule
									</IonLabel>
									<IonText style={{ 
										fontSize: "1.2rem", 
										fontWeight: 600, 
										color: "var(--ion-color-primary)",
										padding: "12px 0"
									}}>
										{isAfter10Am ? "9 PM Draw" : "1 PM Draw"}
									</IonText>
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


				{/* <IonModal
					isOpen={isSubmitting}
					onDidDismiss={() => {
						if (isSubmitting) {
						return;
						}
					}}
					backdropDismiss={false}
					className={isSubmittingModalMinimized ? "minimized-modal" : ""}
					style={{
						'--background': 'transparent',
						'--backdrop-opacity': isSubmittingModalMinimized ? '0' : '0.5',
					}}
				>
					<IonContent style={{ "--background": "transparent", pointerEvents: isSubmittingModalMinimized ? "none" : "auto" }}>
						{isSubmittingModalMinimized ? (
							<div
								style={{
									position: "fixed",
									bottom: "80px",
									left: "50%",
									transform: "translateX(-50%)",
									zIndex: 9999,
									backgroundColor: "var(--ion-color-warning)",
									color: "white",
									padding: "8px 16px",
									borderRadius: "20px",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									gap: "12px",
									boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
									cursor: "pointer",
									userSelect: "none",
									fontSize: "0.85rem",
									fontWeight: 600,
									transition: "all 0.2s ease",
									pointerEvents: "auto",
								}}
								onClick={() => setIsSubmittingModalMinimized(false)}
							>
								<IonSpinner name="crescent" color="warning" style={{ width: "16px", height: "16px" }} />
								<span>Transaction submitting...</span>
							</div>
						) : (
							<div
								style={{
									position: "fixed",
									top: "50%",
									left: "50%",
									transform: "translate(-50%, -50%)",
									zIndex: 9999,
									backgroundColor: "var(--background-color)",
									color: "white",
									padding: "32px 24px 24px 24px",
									borderRadius: "16px",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									minWidth: "320px",
									gap: "16px",
									boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
									border: "1px solid rgba(255, 215, 0, 0.2)",
								}}
							>
								<div
									style={{
										position: "absolute",
										top: "12px",
										right: "12px",
										background: "rgba(255, 215, 0, 0.1)",
										border: "1px solid rgba(255, 215, 0, 0.2)",
										color: "var(--lottery-gold)",
										borderRadius: "6px",
										padding: "6px 12px",
										cursor: "pointer",
										fontSize: "0.8rem",
										fontWeight: 600,
										transition: "all 0.2s ease",
									}}
									onClick={() => setIsSubmittingModalMinimized(true)}
									onMouseEnter={(e) => {
										e.currentTarget.style.background = "rgba(255, 215, 0, 0.15)";
										e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.3)";
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = "rgba(255, 215, 0, 0.1)";
										e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.2)";
									}}
								>
									Minimize
								</div>

								<div style={{
									background: "rgba(46, 213, 115, 0.1)",
									borderRadius: "50%",
									width: "64px",
									height: "64px",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									border: "2px solid rgba(46, 213, 115, 0.3)"
								}}>
									<IonSpinner name="crescent" color="primary" style={{ width: "40px", height: "40px" }} />
								</div>
								<IonText style={{ fontSize: "1.1rem", fontWeight: 700, textAlign: "center", color: "var(--lottery-emerald)" }}>
									SUBMITTING TRANSACTION
								</IonText>
								<IonText style={{ fontSize: "0.9rem", opacity: 0.8, textAlign: "center", color: "var(--text-color-secondary)" }}>
									Please don't close this window or navigate away until the process is complete.
								</IonText>
							</div>
						)}
					</IonContent>
				</IonModal> */}

				{isSubmitting && (
					isSubmittingModalMinimized ? (
						<div
							style={{
								position: "fixed",
								bottom: "80px",
								left: "50%",
								transform: "translateX(-50%)",
								zIndex: 9999,
								backgroundColor: "var(--ion-color-warning)",
								color: "white",
								padding: "8px 16px",
								borderRadius: "20px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: "12px",
								boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
								cursor: "pointer",
								userSelect: "none",
								fontSize: "0.85rem",
								fontWeight: 600,
								transition: "all 0.2s ease",
								pointerEvents: "auto",
							}}
							onClick={() => setIsSubmittingModalMinimized(false)}
						>
							<IonSpinner name="crescent" color="warning" style={{ width: "16px", height: "16px" }} />
							<span>Transaction submitting...</span>
						</div>
					) : (
						<div
							style={{
								position: "fixed",
								top: "50%",
								left: "50%",
								transform: "translate(-50%, -50%)",
								zIndex: 9999,
								backgroundColor: "var(--background-color)",
								color: "white",
								padding: "32px 24px 24px 24px",
								borderRadius: "16px",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								minWidth: "320px",
								gap: "16px",
								boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
								border: "1px solid rgba(255, 215, 0, 0.2)",
							}}
						>
							<div
								style={{
									position: "absolute",
									top: "12px",
									right: "12px",
									background: "rgba(255, 215, 0, 0.1)",
									border: "1px solid rgba(255, 215, 0, 0.2)",
									color: "var(--lottery-gold)",
									borderRadius: "6px",
									padding: "6px 12px",
									cursor: "pointer",
									fontSize: "0.8rem",
									fontWeight: 600,
									transition: "all 0.2s ease",
								}}
								onClick={() => setIsSubmittingModalMinimized(true)}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = "rgba(255, 215, 0, 0.15)";
									e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.3)";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = "rgba(255, 215, 0, 0.1)";
									e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.2)";
								}}
							>
								Minimize
							</div>

							<div style={{
								background: "rgba(46, 213, 115, 0.1)",
								borderRadius: "50%",
								width: "64px",
								height: "64px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								border: "2px solid rgba(46, 213, 115, 0.3)"
							}}>
								<IonSpinner name="crescent" color="primary" style={{ width: "40px", height: "40px" }} />
							</div>
							<IonText style={{ fontSize: "1.1rem", fontWeight: 700, textAlign: "center", color: "var(--lottery-emerald)" }}>
								SUBMITTING TRANSACTION
							</IonText>
							<IonText style={{ fontSize: "0.9rem", opacity: 0.8, textAlign: "center", color: "var(--text-color-secondary)" }}>
								Please don't close this window or navigate away until the process is complete.
							</IonText>
						</div>
					)
				)}


				<IonModal
					isOpen={addJackpotModal}
					onDidDismiss={() => setAddJackpotModal(false)}
					initialBreakpoint={1}		
				>
					<IonContent className="ion-padding" style={{ "--background": "var(--background-color)" }}>
						<div style={{ padding: "16px", textAlign: "center" }}>
							<div style={{
								background: "rgba(46, 204, 113, 0.1)",
								borderRadius: "50%",
								width: "80px",
								height: "80px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								margin: "0 auto 16px auto",
								border: "2px solid var(--lottery-emerald)"
							}}>
								<IonIcon icon={cashOutline} style={{ fontSize: "40px", color: "var(--lottery-emerald)" }} />
							</div>
							
							<h2 style={{ color: "var(--lottery-emerald)", fontWeight: "900", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
								💰 ADD JACKPOT
							</h2>
							<p style={{ color: "var(--text-color-secondary)", marginBottom: "24px", fontSize: "0.95rem" }}>
								You are about to add funds to the jackpot.
							</p>

							<div style={{ 
								background: "linear-gradient(180deg, rgba(20, 20, 20, 0.8) 0%, rgba(30, 30, 30, 0.8) 100%)", 
								borderRadius: "16px", 
								padding: "20px",
								border: "1px solid rgba(46, 204, 113, 0.3)",
								marginBottom: "24px",
								boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
							}}>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
									<IonText color="medium" style={{ fontSize: "0.9rem", fontWeight: "500" }}>
										Target Draw
									</IonText>
									{/* <IonBadge color="success" style={{ fontSize: "1rem", padding: "6px 12px" }}>
										#{isAfter10Am ? "2" : "1"}
									</IonBadge> */}

									<IonBadge 
										id="draw-badge-trigger" 
										color="success" 
										style={{ 
											fontSize: "1rem", 
											padding: "6px 12px", 
											cursor: "pointer" // Make it feel like a button
										}}
									>
										#{isAfter10Am ? "2" : "1"} ▾
									</IonBadge>

									<IonPopover 
										trigger="draw-badge-trigger" 
										mode="ios"
										style={{
											'--width': '200px'
										}}
									>
										<IonContent>
											<IonList lines="none" style={{ background: "transparent" }}>
												<IonItem 
													button 
													onClick={() => {
														setIsAfter10Am(false);
														document.querySelector('ion-popover')?.dismiss();
													}}
													detail={false}
												>
													<IonLabel>#1 (1 PM Draw)</IonLabel>
												</IonItem>
												<IonItem 
													button 
													onClick={() => {
														setIsAfter10Am(true);
														document.querySelector('ion-popover')?.dismiss();
													}}
													detail={false}
												>
													<IonLabel>#2 (9 PM Draw)</IonLabel>
												</IonItem>
											</IonList>
										</IonContent>
									</IonPopover>
								</div>
								
								<div style={{ textAlign: "center", padding: "10px 0" }}>
									<IonText color="medium" style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>
										Amount to Add
									</IonText>
									<div style={{ 
										background: "rgba(0,0,0,0.3)", 
										borderRadius: "8px", 
										padding: "12px",
										border: "1px dashed var(--lottery-emerald)"
									}}>
										<IonText style={{ 
											fontSize: "2.5rem", 
											fontWeight: "900", 
											color: "var(--lottery-emerald)",
											letterSpacing: "2px",
											textShadow: "0 0 20px rgba(46, 204, 113, 0.3)"
										}}>
											$ {jackpotAmount || "0.00"}
										</IonText>
									</div>
								</div>

								<div style={{ marginTop: "20px" }}>
									<IonText color="medium" style={{ fontSize: "0.75rem", display: "block", marginBottom: "6px", textAlign: "left" }}>
										Current {isAfter10Am ? "9 PM" : "1 PM"} Draw Jackpot
									</IonText>
									<div style={{
										background: "rgba(0,0,0,0.5)",
										padding: "8px",
										borderRadius: "4px",
										textAlign: "center"
									}}>
										<IonText color="light" style={{ 
											fontSize: "1.1rem", 
											fontWeight: "700",
											color: "var(--lottery-gold)"
										}}>
											$ {isAfter10Am ? jackpot2 : jackpot}
										</IonText>
									</div>
								</div>

								<div style={{ marginTop: "20px" }}>
									<IonText color="medium" style={{ fontSize: "0.75rem", display: "block", marginBottom: "6px", textAlign: "left" }}>
										Transaction Signature (Hex)
									</IonText>
									<div style={{
										background: "rgba(0,0,0,0.5)",
										padding: "8px",
										borderRadius: "4px",
										textAlign: "left"
									}}>
										<IonText color="light" style={{ 
											fontSize: "0.75rem", 
											fontFamily: "monospace",
											wordBreak: "break-all",
											opacity: 0.7,
											display: "block",
											lineHeight: "1.4"
										}}>
											{signedHex ? signedHex.slice(0, 32) + "..." : "N/A"}
										</IonText>
									</div>
								</div>
							</div>
						</div>
					</IonContent>
					<IonFooter>
						<div style={{ display: "flex", gap: "12px", alignContent: "flex-end", background: "var(--background-color)", padding: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
							<IonButton
								fill="outline"
								color="medium"
								expand="block"
								onClick={handleCancel}
								style={{
									flex: 1,
									fontWeight: "600"
								}}
							>
								Cancel
							</IonButton>

							<IonButton
								color="success"
								expand="block"
								onClick={handleAddJackpot}
								style={{
									flex: 1,
									fontWeight: "bold",
									"--box-shadow": "0 4px 12px rgba(46, 204, 113, 0.4)"
								}}
							>
								<IonIcon icon={cashOutline} slot="start" />
								CONFIRM ADD
							</IonButton>
						</div>
					</IonFooter>
				</IonModal>
			</IonContent>
		</IonPage>
	);
};

export default DashboardPage;
