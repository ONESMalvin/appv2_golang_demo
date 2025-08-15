package main

import (
	"log"

	"github.com/gin-gonic/gin"
)

var (
	testEventCnt int
	eventMap     = make(map[string]int)
)

func main() {
	// 初始化数据库
	if err := InitDatabase(); err != nil {
		log.Fatal("数据库初始化失败:", err)
	}
	defer CloseDatabase()

	// 创建一个默认的Gin引擎
	r := gin.Default()

	r.GET("/", handleManifest)
	r.Use(CORSMiddleware())
	r.Static("/static", "./web/dist")
	r.GET("/manifest", handleManifest)
	r.GET("/all_installations", handleAllInstallations)

	settingGroup := r.Group("/settingPage")
	settingGroup.POST("/entries", handleSettingPageEntries)

	r.Use(JWTAuthMiddleware())

	r.POST("/install_cb", handleInstallCB)
	r.POST("/uninstall_cb", gin.HandlerFunc(func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "success", "message": "请求成功"})
	}))
	r.POST("/enabled_cb", gin.HandlerFunc(func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "success", "message": "请求成功"})
	}))
	r.POST("/disabled_cb", gin.HandlerFunc(func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "success", "message": "请求成功"})
	}))
	// 注册路由
	r.POST("/manhour/validate", handleManhourValidate)
	/*
		settingGroup := r.Group("/settingPage")
		settingGroup.POST("/entries", handleSettingPageEntries)
		settingGroup.GET("/page1", func(c *gin.Context) {
			c.File("web/page1.html")
		})
	*/
	r.POST("/events/webhook", handleEvents)

	r.GET("/oauth/callback", handleOauthCallback)

	// 启动服务器
	if err := r.Run(":8082"); err != nil {
		log.Fatal("服务器启动失败:", err)
	}
}

func handleOauthCallback(c *gin.Context) {
	code := c.Query("code")
	installationID := c.Query("installation_id")
	log.Printf("收到oauth回调: %s, %s", code, installationID)
	c.JSON(200, gin.H{"status": "success", "message": "请求成功", "code": code, "installation_id": installationID})
}

type Extension struct {
	ProviderKey string            `json:"key"`
	Slots       map[string]string `json:"slots"`
	Funcs       map[string]string `json:"funcs"`
	Map         map[string]any    `json:"-"`
}

type ONESEventAppV2 struct {
	EventId      string `json:"eventID"`
	EventType    string `json:"eventType"`
	EventData    any    `json:"eventData"`
	Timestamp    int64  `json:"timestamp"`
	SubscriberID string `json:"subscriberID"`
}

// 处理请求
func handleEvents(c *gin.Context) {
	var requestBody ONESEventAppV2
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(400, gin.H{"error": "无效的请求体"})
		return
	}

	auth := c.Request.Header.Get("Authorization")
	eventId := c.Request.Header.Get("X-Ones-Event-Id")
	eventType := c.Request.Header.Get("X-Ones-Event-Type")
	log.Printf("auth: [%s], eventId: [%s], eventType: [%s], subscriberId: [%s]", auth, eventId, eventType, requestBody.SubscriberID)

	if eventType == "ones:events:health" {
		c.JSON(200, gin.H{"status": "success", "message": "请求成功"})
		return
	}

	eventMap[requestBody.SubscriberID]++
	log.Printf("eventMap[%s]: %d", requestBody.SubscriberID, eventMap[requestBody.SubscriberID])
	/*
		if requestBody.SubscriberID == "TESTCLIE" && eventMap[requestBody.SubscriberID]%5 != 0 {
			time.Sleep(12 * time.Second)
			c.JSON(400, gin.H{"error": "故意"})
			return
		}
	*/
	log.Printf("事件内容: %v", requestBody)
	c.JSON(200, gin.H{"status": "success", "message": "请求成功"})
}

type ManhourOptions struct {
	// 用 scene 来判断是否需要权限校验
	Scene string `json:"scene"`
}

type ManhourRequest struct {
	Type    string         `json:"type"`   // 预估、登记、剩余工时分类
	Action  string         `json:"action"` // add、update、delete
	Mode    string         `json:"mode"`
	Options ManhourOptions `json:"options"`
}

func handleManhourValidate(c *gin.Context) {
	var requestBody ManhourRequest
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(400, gin.H{"error": "无效的请求体"})
		return
	}
	installationID, _ := c.Get("installation_id")
	userID, _ := c.Get("uid")
	installInfo, err := GetInstallation(installationID.(string))
	if err != nil {
		c.JSON(500, gin.H{"error": "获取安装信息失败"})
		return
	}
	body, err := CallONESOpenAPI(installInfo, userID.(string), "/project/issues?teamID=6SpShEhb", "GET", nil)
	if err != nil {
		c.JSON(500, gin.H{"error": "调用OPENAPI失败"})
		return
	}
	log.Printf("调用OPENAPI返回: %s", string(body))

	//log.Printf("manhour请求 %v, header: %v", requestBody, c.Request.Header)
	c.JSON(200, gin.H{"error": map[string]any{
		"reason": "不准提交工时！",
		"level":  "error",
	}})
}

type Entry struct {
	Title   string `json:"title"`    // 设置项标题
	PageUrl string `json:"page_url"` // 设置项页面链接
}

type settingPageEntryRequest struct {
	UserUUID string `json:"user_uuid"` // 用户UUID
	Language string `json:"language"`  // 语言
	Timezone string `json:"timezone"`  // 时区
}

type settingPageEntriesResponse struct {
	Entries []Entry `json:"entries"`
}

func handleSettingPageEntries(c *gin.Context) {
	var requestBody settingPageEntryRequest
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(400, gin.H{"error": "无效的请求体"})
		return
	}
	log.Printf("请求 /settingPage/entries, header: %v, body: %v", c.Request.Header, requestBody)
	returnEntries := settingPageEntriesResponse{
		Entries: []Entry{
			{
				Title: func() string {
					if requestBody.Language == "zh" {
						return "测试"
					}
					return "Test"
				}(),
				PageUrl: "/static/page1.html",
			},
		},
	}
	c.JSON(200, returnEntries)
}

func handleAllInstallations(c *gin.Context) {
	installations, err := GetAllInstallations()
	if err != nil {
		c.JSON(500, gin.H{"error": "获取安装信息失败"})
		return
	}
	c.JSON(200, installations)
}
