package valueobject

import (
	"errors"

	"github.com/shopspring/decimal"
)

// Money represents a monetary value with currency.
type Money struct {
	Amount   decimal.Decimal `json:"amount"`
	Currency string          `json:"currency"`
}

func NewMoney(amount decimal.Decimal, currency string) Money {
	return Money{Amount: amount, Currency: currency}
}

func (m Money) Add(other Money) (Money, error) {
	if m.Currency != other.Currency {
		return Money{}, errors.New("currency mismatch")
	}
	return Money{Amount: m.Amount.Add(other.Amount), Currency: m.Currency}, nil
}

func (m Money) Sub(other Money) (Money, error) {
	if m.Currency != other.Currency {
		return Money{}, errors.New("currency mismatch")
	}
	return Money{Amount: m.Amount.Sub(other.Amount), Currency: m.Currency}, nil
}

func (m Money) Mul(factor decimal.Decimal) Money {
	return Money{Amount: m.Amount.Mul(factor), Currency: m.Currency}
}

func (m Money) IsZero() bool {
	return m.Amount.IsZero()
}

func (m Money) IsNegative() bool {
	return m.Amount.IsNegative()
}
