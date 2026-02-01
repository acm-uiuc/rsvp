import React from "react";
import { Link } from "react-router-dom";
import brandImgUrl from "../../assets/banner-blue.png";

interface LogoBadgeProps {
  size?: string;
  linkTo?: string;
  showText?: boolean;
}

export const LogoBadge: React.FC<LogoBadgeProps> = ({
  size,
  linkTo,
  showText,
}) => {
  const isNonProd = import.meta.env.VITE_RUN_ENVIRONMENT !== "prod";
  if (!size) {
    size = "1em";
  }
  const runEnv = import.meta.env.VITE_RUN_ENVIRONMENT;
  return (
    <b>
      <Link
        to={linkTo || "/"}
        style={{
          fontSize: size,
          textDecoration: "none",
          color: isNonProd
            ? "red"
            : "#0053B3",
          display: "flex",
          alignItems: "center",
        }}
      >
        <img
          src={brandImgUrl}
          alt="ACM Logo"
          style={{ height: "3em", marginRight: "0.5em" }}
        />
        {showText
          ? isNonProd && runEnv
            ? `RSVP Portal ${runEnv.toUpperCase().replace("LOCAL-DEV", "DEV")} ENV`
            : "RSVP Portal"
          : null}
      </Link>
    </b>
  );
};

export default LogoBadge;
