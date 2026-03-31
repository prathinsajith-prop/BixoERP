package entity

import "errors"

var (
	ErrInvalidQuantity   = errors.New("quantity must be greater than zero")
	ErrInsufficientStock = errors.New("insufficient stock quantity")
	ErrWarehouseRequired = errors.New("warehouse is required")
	ErrSKURequired       = errors.New("SKU is required")
	ErrNotFound          = errors.New("entity not found")
	ErrDuplicateSKU      = errors.New("SKU already exists for this tenant and warehouse")
)
