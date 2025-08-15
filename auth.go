package main

import (
	"encoding/base64"
	"fmt"
	"log"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// JWTClaims 定义JWT的声明结构
type JWTClaims struct {
	Iss string `json:"iss"` // 发行者 (ones_base_url)
	Sub string `json:"sub"` // 受众 (installation_id)
	Aud string `json:"aud"` // 受众 (app_id)
	Exp int64  `json:"exp"` // 过期时间
	Iat int64  `json:"iat"` // 签发时间
	Uid string `json:"uid"` // 用户ID
	jwt.RegisteredClaims
}

// VerifyJWT 验证JWT签名
func VerifyJWT(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (any, error) {
		installationID := token.Claims.(*JWTClaims).Sub
		installInfo, err := GetInstallation(installationID)
		if err != nil {
			return nil, err
		}
		validKey, err := base64.StdEncoding.DecodeString(installInfo.SharedSecret)
		if err != nil {
			return nil, err
		}
		return validKey, nil
	}) //, jwt.WithValidMethods([]string{"HS256"}))
	if err != nil {
		log.Fatal(err)
	}
	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("JWT验证失败")
}

// ExtractTokenFromHeader 从Authorization header中提取token
func ExtractTokenFromHeader(authHeader string) (string, error) {
	if authHeader == "" {
		return "", fmt.Errorf("Authorization header为空")
	}

	// 检查Bearer前缀
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return "", fmt.Errorf("Authorization header格式错误，应为: Bearer <token>")
	}

	return parts[1], nil
}

// ValidateRequestAuth 验证请求的JWT认证
func ValidateRequestAuth(authHeader string) (*JWTClaims, error) {
	// 提取token
	tokenString, err := ExtractTokenFromHeader(authHeader)
	if err != nil {
		return nil, err
	}
	// 验证JWT
	claims, err := VerifyJWT(tokenString)
	if err != nil {
		return nil, fmt.Errorf("JWT验证失败: %v", err)
	}

	return claims, nil
}

func MyTestToken() {
	installinfo, err := GetInstallation("install_t2ac614a3eca425b604e823c0c2c88bf")
	if err != nil {
		log.Fatal(err)
	}
	key, err := base64.StdEncoding.DecodeString(installinfo.SharedSecret)
	if err != nil {
		log.Fatal(err)
	}
	tokenString := "eyJhbGciOiJIUzI1NiIsInR5cCI6Imp3dCJ9.eyJhdWQiOiJhcHBfRjYzR1JuYkpSNnhJTkx5SyIsImV4cCI6MTc1NTA3MzAyMywiaWF0IjoxNzU1MDY1ODIzLCJpc3MiOiJodHRwczovL3A4MjA1LWszcy05Lmszcy1kZXYubXlvbmVzLm5ldCIsInJzaCI6IiIsInN1YiI6Imluc3RhbGxfdDJhYzYxNGEzZWNhNDI1YjYwNGU4MjNjMGMyYzg4YmYiLCJ1aWQiOiJYaTdjWVRSVSJ9.Oohh4eJ8QAen7mzsmyjJhubVSaCue8MGeCDIXL7EC9E"
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		return key, nil
	}, jwt.WithValidMethods([]string{"HS256"}))
	if err != nil {
		log.Fatal(err)
	}
	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		for k, v := range claims {
			fmt.Println(k, v)
		}
	} else {
		fmt.Println(err)
	}
}
