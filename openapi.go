package main

import (
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTAssertionClaim struct {
	Uid string `json:"uid"` // 用户ID
	Rsh string `json:"rsh"` // 请求hash
	jwt.RegisteredClaims
}

func genJWTAssertion(installationInfo InstallCallbackReq, userID string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &JWTAssertionClaim{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    installationInfo.InstallationID,
			Subject:   installationInfo.InstallationID,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24)),
			Audience:  jwt.ClaimStrings{"oauth"},
		},
		Uid: userID,
	})
	signKey, err := base64.StdEncoding.DecodeString(installationInfo.SharedSecret)
	if err != nil {
		return "", err
	}
	tokenString, err := token.SignedString(signKey)
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

func getAccessToken(installationInfo InstallCallbackReq, userID string) (string, error) {
	tokenString, err := genJWTAssertion(installationInfo, userID)
	if err != nil {
		return "", err
	}
	ones_url, err := url.Parse(installationInfo.OnesBaseURL)
	if err != nil {
		return "", err
	}
	httpReq, err := http.NewRequest(http.MethodPost, ones_url.ResolveReference(&url.URL{Path: "/oauth2/token"}).String(), nil)
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	form := url.Values{}
	/*
		form.Set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer")
		form.Set("assertion", tokenString)
	*/

	form.Set("grant_type", "client_credentials")
	form.Set("client_assertion", tokenString)
	form.Set("client_id", installationInfo.InstallationID)
	form.Set("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer")

	httpReq.Body = io.NopCloser(strings.NewReader(form.Encode()))
	response, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		return "", err
	}
	token := struct {
		AccessToken  string `json:"access_token"`
		TokenType    string `json:"token_type"`
		Email        string `json:"email"`
		ExpiresIn    int    `json:"expires_in"`
		RefreshToken string `json:"refresh_token"`
		Scope        string `json:"scope"`
		UserId       string `json:"user_id"`
	}{}
	err = json.Unmarshal(body, &token)
	if err != nil {
		return "", err
	}
	return token.AccessToken, nil
}

func CallONESOpenAPI(installationInfo InstallCallbackReq, userID string, api string, method string, body []byte) ([]byte, error) {
	acccess_token, err := getAccessToken(installationInfo, userID)
	if err != nil {
		return nil, err
	}
	ones_url, err := url.Parse(installationInfo.OnesBaseURL)
	if err != nil {
		return nil, err
	}
	path, err := url.Parse("/openapi/v2" + api)
	if err != nil {
		return nil, err
	}
	httpReq, err := http.NewRequest(method, ones_url.ResolveReference(path).String(), nil)
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+acccess_token)
	response, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	body, err = io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	return body, nil
}
