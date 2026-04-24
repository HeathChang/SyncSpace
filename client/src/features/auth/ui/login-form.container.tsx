"use client";

import { useState } from "react";
import { useAuth } from "../model/authProvider";
import { LoginFormUi } from "./login-form.ui";

export function LoginForm() {
    const { login } = useAuth();
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!userId.trim() || !password) {
            setErrorMessage("유저 ID와 비밀번호를 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);
        try {
            const success = await login(userId.trim(), password);
            if (!success) {
                setErrorMessage("로그인 실패: 유저 ID 또는 비밀번호를 확인해주세요.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <LoginFormUi
            userId={userId}
            password={password}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
            onUserIdChange={setUserId}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
        />
    );
}
