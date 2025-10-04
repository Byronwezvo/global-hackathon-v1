import jwt from "jsonwebtoken";

// in production dont allow this - but this is a hackathon after all
const JWT_SECRET = process.env.JWT_SECRET || "R8yF5sWq1LkH3vNc";
const JWT_EXPIRES_IN = "24h";

interface JwtPayload {
  userId: string;
  role?: string;
}

// Generate a token
export const generateToken = (payload: JwtPayload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify a token
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};
