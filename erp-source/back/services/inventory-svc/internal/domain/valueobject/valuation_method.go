package valueobject

type ValuationMethod string

const (
	ValuationFIFO            ValuationMethod = "FIFO"
	ValuationLIFO            ValuationMethod = "LIFO"
	ValuationWeightedAverage ValuationMethod = "WEIGHTED_AVERAGE"
)

func (v ValuationMethod) IsValid() bool {
	switch v {
	case ValuationFIFO, ValuationLIFO, ValuationWeightedAverage:
		return true
	}
	return false
}

func (v ValuationMethod) String() string {
	return string(v)
}
