import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/forgot-password"); }, [navigate]);
  return null;
  
}


export default ResetPassword;