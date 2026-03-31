package entity

import (
	"time"

	"github.com/google/uuid"
)

type Warehouse struct {
	ID        uuid.UUID `json:"id"`
	TenantID  uuid.UUID `json:"tenant_id"`
	Code      string    `json:"code"`
	Name      string    `json:"name"`
	Address   string    `json:"address,omitempty"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func NewWarehouse(tenantID uuid.UUID, code, name, address string) *Warehouse {
	now := time.Now().UTC()
	return &Warehouse{
		ID:        uuid.New(),
		TenantID:  tenantID,
		Code:      code,
		Name:      name,
		Address:   address,
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	}
}
