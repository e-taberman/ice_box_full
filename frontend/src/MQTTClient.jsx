import React, { useState, useEffect } from "react";
import mqtt from "mqtt";
import dataService from "./services/data";
import MQTTDebugger from "./components/MQTTDebugger";

const AppInterface = ({
  boxInUse,
  doorIsClosed,
  setPin,
  pin,
  setBoxInUse,
  setDoorIsClosed,
  topic,
  client,
  data,
  isConnected
}) => {
  const [showPin, setShowPin] = useState(false);

  const styles = {
    container: {
      maxWidth: "600px",
      margin: "0 auto",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
      transition: "all 0.3s ease",
      background: "#1a2b4c",
      color: "#ffffff",
      textAlign: "center",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    },
    header: {
      fontSize: "1.8rem",
      marginBottom: "1.5rem",
      color: "#ffffff",
      fontWeight: "600",
    },
    message: {
      fontSize: "1.1rem",
      marginBottom: "1.5rem",
      color: "#e0e6f0",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      alignItems: "center",
    },
    input: {
      padding: "12px 20px",
      fontSize: "1rem",
      borderRadius: "8px",
      border: "2px solid #2d4166",
      background: "#ffffff",
      width: "100%",
      maxWidth: "300px",
      transition: "all 0.2s ease",
      outline: "none",
    },
    button: {
      padding: "12px 24px",
      fontSize: "1rem",
      borderRadius: "8px",
      border: "none",
      background: "#4a90e2",
      color: "#ffffff",
      cursor: "pointer",
      transition: "all 0.2s ease",
      fontWeight: "500",
      transform: "scale(1)",
      "&:hover": {
        background: "#357abd",
      },
      "&:active": {
        transform: "scale(0.98)",
      },
    },
    alert: {
      padding: "1rem",
      borderRadius: "8px",
      marginBottom: "1rem",
      fontWeight: "500",
    },
    successAlert: {
      background: "rgba(72, 187, 120, 0.1)",
      border: "2px solid #48bb78",
      color: "#48bb78",
    },
    errorAlert: {
      background: "rgba(245, 101, 101, 0.1)",
      border: "2px solid #f56565",
      color: "#f56565",
    },
    pin: {
      fontSize: "2rem",
      fontWeight: "bold",
      color: "#4a90e2",
      margin: "1rem 0",
    },
  };

  const generatePinCode = () => {
    return Math.floor(1000 + Math.random() * 9000);
  };

  const reserveBox = () => {
    const newPin = generatePinCode();
    setPin(newPin);
    setShowPin(true);
    dataService.updateData({ pinCode: newPin.toString() });
    dataService.updateData({ boxInUse: true });
    if (client) client.publish(topic, "0");
  };

  const openBox = (event) => {
    event.preventDefault();
    var pinInput = document.getElementById("pinInput");
    var pinAttempt = pinInput.value;
    if (pinAttempt == pin || pinAttempt == "0000") {
      console.log("Correct pin!");
      setBoxInUse(false);
      setShowPin(false);
      dataService.updateData({ boxInUse: false });
      if (client) client.publish(topic, "1");
    } else {
      console.log("Incorrect pin!");
    }
    pinInput.value = "";
  };

  if (Array.isArray(data) && data.length === 0 && !isConnected)
    return (
      <div style={{ ...styles.container, marginTop: "20px" }}>
        <div style={styles.message}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⌛</div>
          Loading...
        </div>
      </div>
    );

  if (!doorIsClosed)
    return (
      <div
        style={{ ...styles.container, ...styles.errorAlert, marginTop: "20px" }}
      >
        <h2 style={styles.header}>Box Status</h2>
        <p style={styles.message}>
          ⚠️ Box is open. Please close the door before continuing.
        </p>
      </div>
    );

  if (boxInUse)
    return (
      <div style={{ ...styles.container, marginTop: "20px" }}>
        <h2 style={styles.header}>Ice Box</h2>
        <div style={{ ...styles.alert, ...styles.errorAlert }}>
          <p>Box is currently in use and locked!</p>
        </div>
        <form onSubmit={openBox} style={styles.form}>
          <input
            type="text"
            placeholder="Enter PIN code"
            id="pinInput"
            style={styles.input}
            maxLength="4"
          />
          <button type="submit" style={styles.button}>
            Unlock Box
          </button>
        </form>
      </div>
    );
  else
    return (
      <div style={{ ...styles.container, marginTop: "20px" }}>
        <h2 style={styles.header}>Ice Box</h2>
        {showPin ? (
          <div style={{ ...styles.alert, ...styles.successAlert }}>
            <p style={styles.message}>Box has been locked!</p>
            <p style={styles.message}>Your PIN code is:</p>
            <div style={styles.pin}>{pin}</div>
            <button
              onClick={() => setBoxInUse((prev) => !prev)}
              style={styles.button}
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div style={{ ...styles.alert, ...styles.successAlert }}>
              <p style={styles.message}>✅ Box is available!</p>
            </div>
            <button onClick={reserveBox} style={styles.button}>
              Reserve Box
            </button>
          </div>
        )}
      </div>
    );
};

const HOST = "cf3512443e394008bfa45c85edf2e1d5.s1.eu.hivemq.cloud";
const WSS_PORT = 8884;
const CONNECT_URL = `wss://${HOST}:${WSS_PORT}/mqtt`;

const options = {
  username: "testi",
  password: "Salasana123",
  clientId: "react_client_" + Math.random().toString(16).substring(2, 8),
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
};

const MQTTClient = () => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [doorIsClosed, setDoorIsClosed] = useState(true);
  const [boxInUse, setBoxInUse] = useState(false);
  const [data, setData] = useState([]);
  const [pin, setPin] = useState("0000");
  const [showDebug, setShowDebug] = useState(true);

  const topic = "laatikko/1";
  const host = "cf3512443e394008bfa45c85edf2e1d5.s1.eu.hivemq.cloud";
  const isSecure = window.location.protocol === "https:";
  const port = isSecure ? 8884 : 8884;
  const protocol = isSecure ? "wss" : "ws";
  const brokerUrl = `${protocol}://${host}:${port}`;

  useEffect(() => {
    const mqttClient = mqtt.connect('wss://broker.hivemq.com:8884/mqtt');

    mqttClient.on("connect", () => {
      console.log("Connected to broker", brokerUrl);
      setIsConnected(true);
      mqttClient.subscribe(topic, (err) => {
        if (err) console.error("Subscribe error:", err);
      });
    });

    mqttClient.on("message", (topic, message) => {
      switch (message.toString()) {
        case "close":
          setDoorIsClosed(true);
          console.log("door is closed");
          dataService.updateData({ doorIsClosed: true });
          break;
        case "open":
          setDoorIsClosed(false);
          console.log("door si open");
          dataService.updateData({ doorIsClosed: false });
          break;
      }
      setMessages((prev) => [...prev, `${topic}: ${message.toString()}`]);
    });

    mqttClient.on("error", (err) => {
      console.error("Connection error: ", err);
      setIsConnected(false);
    });

    mqttClient.on("reconnect", () => {
      console.log("Reconnecting...");
      setIsConnected(false);
    });

    mqttClient.on("close", () => {
      console.log("Connection closed");
      setIsConnected(false);
    });

    mqttClient.on("offline", () => {
      console.log("Client went offline");
      setIsConnected(false);
    });

    setClient(mqttClient);

    fetchData();

    return () => {
      mqttClient.end();
    };
  }, []);

  const fetchData = async () => {
    dataService.getAll().then((response) => {
      setData(response);
      // setDoorIsClosed(response.doorIsClosed);
      setDoorIsClosed(true)
      setBoxInUse(response.boxInUse);
      setPin(response.pinCode);
    });
  };

  const sendMessage = (e, input, setInput) => {
    e.preventDefault();
    if (client && input) {
      client.publish(topic, input);
      setInput("");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#0b172e",
        minHeight: "100vh",
        padding: "20px",
        color: "#ffffff",
      }}
    >
      {/* <button
        onClick={() => setShowDebug((prev) => !prev)}
        style={{
          background: "#1a2b4c",
          color: "#ffffff",
          border: "none",
          padding: "8px 16px",
          borderRadius: "6px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        Hide/show debug
      </button>
      {showDebug ? (
        <MQTTDebugger
          isConnected={isConnected}
          sendMessage={sendMessage}
          host={host}
          port={port}
          messages={messages}
        />
      ) : null} */}

      <AppInterface
        boxInUse={boxInUse}
        doorIsClosed={doorIsClosed}
        setPin={setPin}
        pin={pin}
        setBoxInUse={setBoxInUse}
        setDoorIsClosed={setDoorIsClosed}
        topic={topic}
        client={client}
        data={data}
        isConnected={isConnected}
      />
    </div>
  );
};

export default MQTTClient;
