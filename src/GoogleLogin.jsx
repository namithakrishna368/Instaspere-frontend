import { GoogleLogin } from "@react-oauth/google";


export default function GoogleAuth({ onSuccess }) {
return <GoogleLogin onSuccess={(res) => onSuccess(res.credential)} />;
}