import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, useIonToast } from "@ionic/react";
import React, { useEffect, useState, useRef } from "react";
import webSocketService from "../services/webSocket.service";

type LogType = "started" | "draw" | "other";

type LogBlock = {
  blockNumber: string;
  time: string;
  status?: string;
  lines: { type: LogType; text: string }[];
};

const TerminalPage: React.FC = () => {
  const [logs, setLogs] = useState<LogBlock[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const [present] = useIonToast();

  useEffect(() => {
    webSocketService.connect();

    const shortenAddress = (address: string, start = 5, end = 4) => {
      if (!address) return "";
      if (address.length <= start + end) return address;
      return `${address.slice(0, start)}…${address.slice(-end)}`;
    };

    const handleMessage = (data: any) => {
      const now = new Date();

      const time = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      if (typeof data !== "object" || !data?.data) return;

      const cleanedData = { ...data.data };
      const blockNumber = String(cleanedData.block);
      const status = cleanedData.status;

      delete cleanedData.block;

      ["contract", "operator", "dev"].forEach((key) => {
        if (!cleanedData[key]) {
          delete cleanedData[key];
        } else {
          cleanedData[key] = shortenAddress(cleanedData[key]);
        }
      });

      let type: LogType = "other";

      if (cleanedData.drawNumber !== undefined) {
        type = "draw";
      } else if (cleanedData.status) {
        type = "started";
      }

      const lineText = Object.entries(cleanedData)
        .map(([key, value]) =>
          `"${key}": ${typeof value === "string" ? `"${value}"` : value}`
        )
        .join(", ");


      setLogs((prev) => {
        const existing = prev.find((p) => p.blockNumber === blockNumber);

        if (existing) {
          const updated = prev.map((p) => {
            if (p.blockNumber !== blockNumber) return p;
        
            let newLines = p.lines;
        
            if (type === "started") {
              newLines = p.lines.filter((l) => l.type !== "started");
              newLines = [...newLines, { type, text: lineText }];
            } 
            else if (type === "draw") {
              const alreadyExists = p.lines.some(
                (l) => l.type === "draw" && l.text === lineText
              );
        
              if (!alreadyExists) {
                newLines = [...p.lines, { type, text: lineText }];
              }
            } 
            else {
              newLines = [...p.lines, { type, text: lineText }];
            }
        
            return {
              ...p,
              status: status ?? p.status,
              lines: newLines,
            };
          });
        
          return updated.slice(-50);
        }
        
        const updated = [
          ...prev,
          {
            blockNumber,
            time,
            status,
            lines: [{ type, text: lineText }],
          }
        ];
        
        return updated.slice(-50);
      });
    };

    const handleStatus = (status: "connected" | "disconnected" | "error", error?: any) => {
      if (status === "connected") {
        present({
          message: "WebSocket Connected",
          duration: 2000,
          color: "success",
          position: "top",
        });
      } else if (status === "error") {
        console.error("WebSocket Error Details:", error);
        present({
          message: "WebSocket Connection Failed. Check if the server is running and accessible.",
          duration: 5000,
          color: "danger",
          position: "top",
        });
      }
    };

    webSocketService.addListener(handleMessage);
    webSocketService.addStatusListener(handleStatus);

    return () => {
      webSocketService.removeListener(handleMessage);
      webSocketService.removeStatusListener(handleStatus);
    };
  }, [present]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <IonPage>
      <IonHeader translucent={true}>
        <IonToolbar>
          <IonTitle>👨🏻‍💻 Terminal</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div
          ref={contentRef}
          style={{
            height: "88%",
            width: "100%",
            backgroundColor: "#000",
            borderRadius: "8px",
            color: "#0f0",
            padding: "1rem",
            fontFamily: "monospace",
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            fontSize: "10px",
          }}
        >
          {logs.map((log, index) => {
            return (
              <div key={index}>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: "#90ee90",
                  }}
                >
                  Block: #{log.blockNumber} {log.time}
                </div>

                {log.lines.map((line, i) => {
                  if (line.type === "started") {
                    return (
                      <div key={i} style={{ fontWeight: "bold" }}>
                      <span style={{ color: "yellow"}}>Lottery </span>
                        {line.text}
                      </div>
                    );
                  }

                  if (line.type === "draw") {
                    const parts = line.text.split(/("drawNumber":\s*\d+)/g);
                  
                    return (
                      <div key={i} style={{ fontWeight: "bold" }}>
                        {parts.map((part, j) => {
                          if (/"drawNumber":\s*\d+/.test(part)) {
                            const numberMatch = part.match(/\d+/);
                            const number = numberMatch ? numberMatch[0] : "";

                            return (
                              <span key={j}>
                                <span style={{ color: "#4da6ff" }}>Draw: #{number}</span>
                                
                              </span>
                            );
                          }

                          return <span key={j}>{part}</span>;
                        })}
                      </div>
                    );
                  }
                  return <div key={i}>{line.text}</div>;
                })}
              </div>
            );
          })}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TerminalPage;
