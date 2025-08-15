package main

import (
	"database/sql"
	"errors"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

// InitDatabase 初始化数据库连接和表结构
func InitDatabase() error {
	var err error
	db, err = sql.Open("sqlite3", "./appv2.db")
	if err != nil {
		return err
	}

	// 创建安装回调记录表
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS install_callbacks (
		installation_id TEXT PRIMARY KEY NOT NULL,
		org_id TEXT NOT NULL,
		ones_base_url TEXT NOT NULL,
		shared_secret TEXT NOT NULL,
		callback_type TEXT NOT NULL,
		time_stamp INTEGER NOT NULL,
		app_id TEXT,
		app_version TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	_, err = db.Exec(createTableSQL)
	if err != nil {
		return err
	}

	log.Println("数据库初始化成功")
	return nil
}

// SaveInstallCallback 保存安装回调信息到数据库
func SaveInstallCallback(req InstallCallbackReq) error {
	insertSQL := `
	INSERT INTO install_callbacks (
		installation_id, org_id, ones_base_url, shared_secret, 
		callback_type, time_stamp, app_id, app_version
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?) on conflict(installation_id) do update set
		org_id = ?,
		ones_base_url = ?,
		shared_secret = ?,
		callback_type = ?,
		time_stamp = ?,
		app_id = ?,
		app_version = ?`

	var appID, appVersion string
	if req.App != nil {
		appID = req.App.ID
		appVersion = req.App.Version
	}

	_, err := db.Exec(insertSQL,
		req.InstallationID,
		req.OrgID,
		req.OnesBaseURL,
		req.SharedSecret,
		req.CallbackType,
		req.TimeStamp,
		appID,
		appVersion,
		req.OrgID,
		req.OnesBaseURL,
		req.SharedSecret,
		req.CallbackType,
		req.TimeStamp,
		appID,
		appVersion,
	)

	if err != nil {
		return err
	}

	log.Printf("安装回调信息已保存: InstallationID=%s, OrgID=%s, Secret=%s", req.InstallationID, req.OrgID, req.SharedSecret)
	return nil
}

// GetInstallation 根据installation_id获取安装回调记录
func GetInstallation(installationID string) (InstallCallbackReq, error) {
	query := `SELECT installation_id, org_id, ones_base_url, shared_secret, 
			  callback_type, time_stamp, app_id, app_version 
			  FROM install_callbacks WHERE installation_id = ?`

	rows, err := db.Query(query, installationID)
	if err != nil {
		return InstallCallbackReq{}, err
	}
	defer rows.Close()

	if rows.Next() {
		var req InstallCallbackReq
		var appID, appVersion string

		err := rows.Scan(
			&req.InstallationID,
			&req.OrgID,
			&req.OnesBaseURL,
			&req.SharedSecret,
			&req.CallbackType,
			&req.TimeStamp,
			&appID,
			&appVersion,
		)
		if err != nil {
			return InstallCallbackReq{}, err
		}

		if appID != "" {
			req.App = &AppInfo{
				ID:      appID,
				Version: appVersion,
			}
		}

		return req, nil
	}

	return InstallCallbackReq{}, errors.New("installation not found")
}

// CloseDatabase 关闭数据库连接
func CloseDatabase() error {
	if db != nil {
		return db.Close()
	}
	return nil
}

func GetAllInstallations() ([]*InstallCallbackReq, error) {
	query := `SELECT installation_id, org_id, ones_base_url, shared_secret, 
			  callback_type, time_stamp, app_id, app_version 
			  FROM install_callbacks`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var installations []*InstallCallbackReq
	for rows.Next() {
		var req InstallCallbackReq
		var appID, appVersion string
		err := rows.Scan(
			&req.InstallationID,
			&req.OrgID,
			&req.OnesBaseURL,
			&req.SharedSecret,
			&req.CallbackType,
			&req.TimeStamp,
			&appID,
			&appVersion,
		)
		if err != nil {
			return nil, err
		}
		if appID != "" {
			req.App = &AppInfo{
				ID:      appID,
				Version: appVersion,
			}
		}
		installations = append(installations, &req)
	}
	return installations, nil
}
