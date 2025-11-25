package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()

	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Mao bakend is running !",
			"version": "1.0.0",
		})
	})

	log.Println("Server start on :8080")
	if err := app.Listen(":8080"); err != nil {
		log.Fatal(err)
	}
}
