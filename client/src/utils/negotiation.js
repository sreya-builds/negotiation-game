export const MAX_ROUNDS = 5

export const extractOffer = (text) => {
  const numbers = text.match(/\d+/g)
  if (!numbers) return null
  return Number(numbers[0])
}