package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// JWTAuthMiddleware JWT认证中间件
func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "缺少Authorization header"})
			c.Abort()
			return
		}

		// 验证JWT
		claims, err := ValidateRequestAuth(authHeader)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "JWT验证失败: " + err.Error()})
			log.Println("JWT验证失败: ", err.Error())
			c.Abort()
			return
		}

		// 将installation_id存储到上下文中，供后续处理函数使用
		c.Set("installation_id", claims.Sub)
		c.Set("uid", claims.Uid)
		c.Set("ones_url", claims.Iss)
		c.Next()
	}
}
