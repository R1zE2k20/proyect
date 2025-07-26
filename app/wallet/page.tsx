"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Wallet, ArrowUpRight, ArrowDownLeft, History, TrendingUp } from "lucide-react"

export default function WalletPage() {
  const { user, addTransaction } = useAuth()
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [selectedCrypto, setSelectedCrypto] = useState("BTC")

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-white mb-8">Inicia sesión para acceder a tu wallet</h1>
        </div>
      </div>
    )
  }

  const handleDeposit = () => {
    const amount = Number.parseFloat(depositAmount)
    if (amount > 0) {
      addTransaction({
        type: "deposit",
        amount,
        crypto: selectedCrypto,
        status: "completed",
      })
      setDepositAmount("")
    }
  }

  const handleWithdraw = () => {
    const amount = Number.parseFloat(withdrawAmount)
    if (amount > 0 && amount <= user.balance) {
      addTransaction({
        type: "withdrawal",
        amount,
        crypto: selectedCrypto,
        status: "pending",
      })
      setWithdrawAmount("")
    }
  }

  const cryptos = [
    { symbol: "BTC", name: "Bitcoin", balance: user.cryptoBalances.BTC, price: 45000 },
    { symbol: "ETH", name: "Ethereum", balance: user.cryptoBalances.ETH, price: 2800 },
    { symbol: "LTC", name: "Litecoin", balance: user.cryptoBalances.LTC, price: 180 },
    { symbol: "USDT", name: "Tether", balance: user.cryptoBalances.USDT, price: 1 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            <Wallet className="inline w-12 h-12 mr-4" />
            Mi Wallet
          </h1>
          <p className="text-xl text-gray-300">Gestiona tus criptomonedas y saldo</p>
        </div>

        {/* Saldo principal */}
        <Card className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white mb-8">
          <CardContent className="p-8 text-center">
            <div className="text-6xl font-bold mb-2">${user.balance.toLocaleString()}</div>
            <div className="text-xl opacity-90">Saldo Total del Casino</div>
          </CardContent>
        </Card>

        <Tabs defaultValue="balances" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/10">
            <TabsTrigger value="balances" className="text-white">
              Saldos
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-white">
              Transacciones
            </TabsTrigger>
            <TabsTrigger value="deposit-withdraw" className="text-white">
              Depósito/Retiro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="balances">
            <div className="grid md:grid-cols-2 gap-6">
              {cryptos.map((crypto) => (
                <Card key={crypto.symbol} className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-xl">{crypto.name}</CardTitle>
                        <CardDescription className="text-gray-300">{crypto.symbol}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                        <TrendingUp className="w-3 h-3 mr-1" />${crypto.price.toLocaleString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Balance:</span>
                        <span className="font-bold">
                          {crypto.balance} {crypto.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor USD:</span>
                        <span className="font-bold text-yellow-400">
                          ${(crypto.balance * crypto.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Historial de Transacciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.transactions.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No hay transacciones aún</p>
                  ) : (
                    user.transactions.slice(0, 10).map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-full ${
                              transaction.type === "deposit"
                                ? "bg-green-500/20"
                                : transaction.type === "withdrawal"
                                  ? "bg-red-500/20"
                                  : transaction.type === "win"
                                    ? "bg-yellow-500/20"
                                    : "bg-blue-500/20"
                            }`}
                          >
                            {transaction.type === "deposit" ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium capitalize">{transaction.type}</div>
                            <div className="text-sm text-gray-400">
                              {new Date(transaction.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold ${
                              transaction.type === "deposit" || transaction.type === "win"
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {transaction.type === "deposit" || transaction.type === "win" ? "+" : "-"}$
                            {transaction.amount.toLocaleString()}
                          </div>
                          <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposit-withdraw">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Depósito */}
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="text-green-400">Depositar Fondos</CardTitle>
                  <CardDescription className="text-gray-300">Añade criptomonedas a tu cuenta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Criptomoneda</Label>
                    <select
                      value={selectedCrypto}
                      onChange={(e) => setSelectedCrypto(e.target.value)}
                      className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
                    >
                      {cryptos.map((crypto) => (
                        <option key={crypto.symbol} value={crypto.symbol} className="bg-gray-800">
                          {crypto.name} ({crypto.symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Cantidad (USD)</Label>
                    <Input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <Button onClick={handleDeposit} className="w-full bg-green-600 hover:bg-green-700">
                    <ArrowDownLeft className="w-4 h-4 mr-2" />
                    Depositar
                  </Button>

                  <div className="p-3 bg-blue-500/20 rounded text-sm text-blue-200">
                    <strong>Nota:</strong> Esta es una simulación. En un entorno real, aquí se mostraría la dirección de
                    wallet para el depósito.
                  </div>
                </CardContent>
              </Card>

              {/* Retiro */}
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="text-red-400">Retirar Fondos</CardTitle>
                  <CardDescription className="text-gray-300">Retira tus ganancias</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Cantidad (USD)</Label>
                    <Input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      max={user.balance}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="text-sm text-gray-400">Saldo disponible: ${user.balance.toLocaleString()}</div>

                  <Button
                    onClick={handleWithdraw}
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={!withdrawAmount || Number.parseFloat(withdrawAmount) > user.balance}
                  >
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Retirar
                  </Button>

                  <div className="p-3 bg-yellow-500/20 rounded text-sm text-yellow-200">
                    <strong>Procesamiento:</strong> Los retiros pueden tardar 1-24 horas en procesarse.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
