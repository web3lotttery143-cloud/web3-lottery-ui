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
} from "@ionic/react";

import React, { useState, useEffect } from "react";
import DigitInput from "../components/DigitInput";
import { PLACE_BET } from "../graphql/queries";
import xteriumService from "../services/xteriumService";
import useAppStore from "../store/useAppStore";
import lotteryService from "../services/lotteryService";
import walletService from "../services/walletService";

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
	const { walletAddress } = useAppStore();
	const [betNumber, setBetNumber] = useState("");
	const [presentLoading, dismissLoading] = useIonLoading();
	const [presentToast] = useIonToast();
	const [selectedSegment, setSelectedSegment] = useState<SegmentValue>("first");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [confirmationModal, setConfirmationModal] = useState(false);
	const [draw, setDraw] = useState("1");
	const [winnerNumber, setWinnerNumber] = useState("");
	const [signedHex, setSignedHex] = useState("");
	const [progress, setProgress] = useState(0);

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

		await presentLoading({ message: "Waiting for signature..." });

		try {
			const result = await lotteryService.addBet();

			if (!result.ok) {
				presentToast({
					message: `Add bet failed: ${result.error}`,
					color: "danger",
					duration: 5000,
				});
				return;
			}

			const hex = result.data;
			const signed_hex = await walletService.signTransaction(
				hex,
				walletAddress,
				betNumber
			);
		} catch (e: any) {
			console.error(e);
			presentToast({
				message: e.message || "An error occurred.",
				duration: 3000,
				color: "danger",
			});
		} finally {
			dismissLoading;
		}
	};

	const handleRefresh = (event: CustomEvent) => {
		refetch().finally(() => event.detail.complete());
	};

	useEffect(() => {
		const getDraws = async () => {
			try {
				const data = await lotteryService.getDraws();
				const winningNumber = data.Ok?.[0]?.winningNumber;
				setWinnerNumber(winningNumber || "N/A"); // update state
			} catch (error) {
				presentToast({
					message: `${error}`,
					duration: 3000,
					color: "danger",
				});
			}
		};

		getDraws();
	}, []);

	const handleSubmit = async () => {
		presentLoading("Submitting transaction...");
		window.history.replaceState({}, document.title, window.location.pathname);

		try {
			const payload = {
				signed_hex: signedHex,
				draw_number: draw,
				bet_number: Number(betNumber),
				bettor: walletAddress!,
				upline: "XqDGJ69MXL1WhHZiQHsA8HJTu7auK3ZePQZJetMrq3GT5smso",
			};
			const executeBet = await lotteryService.executeBet(payload);

			presentToast({
				message: `${JSON.stringify(executeBet, null, 2)}`,
				duration: 10000,
				color: "success",
			});
		} catch (error) {
			presentToast({
				message: `${error}`,
				duration: 10000,
				color: "danger",
			});
		} finally {
			dismissLoading();
			setConfirmationModal(false);
		}
	};

	useEffect(() => {
		// what i am gonna do this just check the url if there is a signedHex, and if there is, open a confirmation modal. this prevents to call the api (executebet endpoint multiple times)
		const run = async () => {
			try {
				const signed = await walletService.checkSignedTxFromUrl(); // make this return an array of success: true, signedHex: string, use the success to be the trigger if u should open a modal

				setSignedHex(signed!);
				// ⛔ If URL no longer has the tx, skip
				if (signed) {
					setConfirmationModal(true);
				}
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
				window.history.replaceState({}, document.title, window.location.pathname);
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
						<IonCard className="custom-card">
							<IonCardContent className="ion-text-center">
								<div
									className="ion-text-center ion-padding fade-in"
									style={{ marginTop: "20vh" }}
								>
									<IonText>
										<h3
											style={{ fontWeight: 600, color: "var(--lottery-gold)" }}
										>
											Winning number:{" "}
											{winnerNumber !== "N/A" ? winnerNumber : "No results yet"}
										</h3>
									</IonText>
								</div>
							</IonCardContent>
						</IonCard>
					)}

					{selectedSegment === "second" && (
						<IonCard className="custom-card">
							<IonCardContent className="ion-text-center">
								<div
									className="ion-text-center ion-padding fade-in"
									style={{ marginTop: "20vh" }}
								>
									<IonText>
										<h3
											style={{ fontWeight: 600, color: "var(--lottery-gold)" }}
										>
											No Results Yet
										</h3>
										<p style={{ color: "var(--text-color-secondary)" }}>
											No lottery draws have been completed yet.
										</p>
									</IonText>
								</div>
							</IonCardContent>
						</IonCard>
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
									${cycle ? parseFloat(cycle.totalJackpot).toFixed(2) : "0.00"}
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
								>
									{cycle ? cycle.totalBets : 0} / 10,000 Tickets Sold
								</p>
							</IonText>
							<div className="progress-container">
								<div
									className="progress-bar"
									style={{ width: `${(cycle?.totalBets || 0) / 100}%` }}
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
										<p>Draw number: {draw}</p>
										<p>Bet number: {betNumber}</p>
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
			</IonContent>
		</IonPage>
	);
};

export default DashboardPage;
