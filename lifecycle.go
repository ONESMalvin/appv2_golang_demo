package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

type AppInfo struct {
	ID      string `json:"id"`
	Version string `json:"version"`
}

type InstallCallbackReq struct {
	InstallationID string   `json:"installation_id"`
	OrgID          string   `json:"org_id"`
	OnesBaseURL    string   `json:"ones_base_url"`
	SharedSecret   string   `json:"shared_secret"`
	CallbackType   string   `json:"callback_type"`
	TimeStamp      int64    `json:"time_stamp"`
	App            *AppInfo `json:"app"`
}

type InstallCallbackResp struct {
	InstallationID string `json:"installation_id"`
	TimeStamp      int64  `json:"time_stamp"`
}

func handleInstallCB(c *gin.Context) {
	var requestBody InstallCallbackReq
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 保存安装回调信息到数据库
	if err := SaveInstallCallback(requestBody); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存数据失败: " + err.Error()})
		return
	}

	log.Printf("安装回调信息已保存: %v", requestBody.InstallationID)

	c.JSON(http.StatusOK, InstallCallbackResp{
		InstallationID: requestBody.InstallationID,
		TimeStamp:      time.Now().Unix(),
	})
}

// handleManifest 处理manifest请求
func handleManifest(c *gin.Context) {
	// 读取manifest.json文件
	manifestData, err := os.ReadFile("manifest.json")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法读取manifest文件"})
		return
	}

	c.Data(http.StatusOK, "application/json", manifestData)
}

func handleGetInstallInfo(c *gin.Context) {
	installationID := c.Param("installation_id")

	installInfo, err := GetInstallation(installationID)
	if err != nil {
		log.Printf("查询失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取安装信息失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, installInfo)
}
