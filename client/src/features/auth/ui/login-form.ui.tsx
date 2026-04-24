"use client";

interface LoginFormUiProps {
    userId: string;
    password: string;
    isSubmitting: boolean;
    errorMessage: string | null;
    onUserIdChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: () => void;
}

export function LoginFormUi({
    userId,
    password,
    isSubmitting,
    errorMessage,
    onUserIdChange,
    onPasswordChange,
    onSubmit,
}: LoginFormUiProps) {
    return (
        <div className="login-shell">
            <form
                className="login-card"
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
            >
                <h1>SyncSpace 로그인</h1>
                <p className="muted">학습용 목 계정 (예: u1/password1, u2/password2)</p>

                <label>
                    <span>유저 ID</span>
                    <input
                        value={userId}
                        onChange={(event) => onUserIdChange(event.target.value)}
                        autoComplete="username"
                        placeholder="u1"
                        aria-label="유저 ID"
                    />
                </label>

                <label>
                    <span>비밀번호</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => onPasswordChange(event.target.value)}
                        autoComplete="current-password"
                        placeholder="password1"
                        aria-label="비밀번호"
                    />
                </label>

                {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "로그인 중..." : "로그인"}
                </button>
            </form>
        </div>
    );
}
