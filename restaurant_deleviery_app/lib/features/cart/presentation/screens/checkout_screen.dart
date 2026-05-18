import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import 'package:provider/provider.dart';
import 'package:restaurant_delivery_app/features/cart/presentation/controllers/cart_controller.dart';
import 'package:restaurant_delivery_app/features/payment/presentation/controllers/payment_controller.dart';
import 'package:restaurant_delivery_app/features/payment/presentation/widgets/payment_method_sheet.dart';
import 'package:restaurant_delivery_app/features/address/presentation/controllers/address_controller.dart';
import 'package:restaurant_delivery_app/features/address/presentation/widgets/address_selection_sheet.dart';
import 'package:restaurant_delivery_app/features/auth/presentation/controllers/auth_controller.dart';
import 'package:restaurant_delivery_app/features/auth/presentation/screens/login_screen.dart';
import 'package:restaurant_delivery_app/features/orders/presentation/controllers/order_controller.dart';
import 'package:restaurant_delivery_app/features/scan/presentation/screens/scan_payment_screen.dart';
import '../../../../core/theme/colors.dart';

enum OrderType { eating, delivery, takeaway }

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  OrderType _selectedOrderType = OrderType.delivery;
  String? _phoneNumber;
  final TextEditingController _phoneController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthController>();
      if (!auth.isAuthenticated) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
      }

      // If a table is already scanned, default to Eating
      final cart = context.read<CartController>();
      if (cart.currentTable != null) {
        setState(() {
          _selectedOrderType = OrderType.eating;
        });
      }

      // Pre-fill phone from auth if available
      final user = auth.user;
      if (user != null && user['phone'] != null) {
        _phoneController.text = user['phone'];
        _phoneNumber = user['phone'];
      }
    });
  }

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  void _showAddressSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => const AddressSelectionSheet(),
    );
  }

  void _showPaymentSheet() async {
    final result = await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: const PaymentMethodSheet(),
      ),
    );

    if (result == true) {
      setState(() {
        // Method is already selected in controller, phone is handled by controller/textfield
      });
    }
  }

  void _navigateToScanner() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const ScanPaymentScreen()),
    );
  }

  double _calculateTotal(CartController cart) {
    double total = 0;
    for (var item in cart.cartItems) {
      total += (item['menuItem']['price'] as num) * item['quantity'];
    }
    return total;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(IconlyLight.arrow_left, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Checkout",
          style: TextStyle(
            color: Color(0xFF2D3E2D),
            fontWeight: FontWeight.w500,
            fontFamily: "Poppins",
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                _buildOrderTypeSelector(),
                const SizedBox(height: 25),

                if (_selectedOrderType == OrderType.delivery) ...[
                  _buildSectionTitle("Delivery Address"),
                  const SizedBox(height: 10),
                  _buildAddressCard(),
                  const SizedBox(height: 25),
                ],

                if (_selectedOrderType == OrderType.eating) ...[
                  _buildSectionTitle("Table Information"),
                  const SizedBox(height: 10),
                  _buildTableCard(),
                  const SizedBox(height: 25),
                ],

                _buildSectionTitle("Payment Method"),
                const SizedBox(height: 10),
                _buildPaymentCard(),
                const SizedBox(height: 25),

                _buildOrderSummary(),
              ],
            ),
          ),
          _buildConfirmButton(context),
        ],
      ),
    );
  }

  Widget _buildOrderSummary() {
    return Consumer<CartController>(
      builder: (context, cart, child) {
        final total = _calculateTotal(cart);
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(25),
          ),
          child: Column(
            children: [
              _buildSummaryRow("Subtotal", "\$${total.toStringAsFixed(2)}"),
              const SizedBox(height: 10),
              _buildSummaryRow("Service Fee", "\$0.00"),
              const Divider(height: 30),
              _buildSummaryRow(
                "Total Amount",
                "\$${total.toStringAsFixed(2)}",
                isTotal: true,
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isTotal ? Colors.black : Colors.grey[600],
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: isTotal ? AppColors.primaryColor : Colors.black,
            fontSize: isTotal ? 18 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildOrderTypeSelector() {
    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          _buildOrderTypeButton(
            "Eating",
            OrderType.eating,
            IconlyLight.tick_square,
          ),
          _buildOrderTypeButton(
            "Delivery",
            OrderType.delivery,
            IconlyLight.location,
          ),
          _buildOrderTypeButton(
            "Takeaway",
            OrderType.takeaway,
            IconlyLight.bag,
          ),
        ],
      ),
    );
  }

  Widget _buildOrderTypeButton(String label, OrderType type, IconData icon) {
    final isSelected = _selectedOrderType == type;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedOrderType = type),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primaryColor : Colors.transparent,
            borderRadius: BorderRadius.circular(15),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: isSelected ? Colors.white : Colors.grey,
                size: 20,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.grey,
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTableCard() {
    return Consumer<CartController>(
      builder: (context, cart, child) {
        final table = cart.currentTable;
        return GestureDetector(
          onTap: _navigateToScanner,
          child: Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: table == null
                    ? AppColors.secondaryColor.withOpacity(0.5)
                    : Colors.transparent,
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: const BoxDecoration(
                    color: Color(0xFFF1F8F1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    IconlyLight.scan,
                    color: AppColors.btnColor,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        table != null
                            ? "Table: ${table['name']}"
                            : "Scan Table QR",
                        style: const TextStyle(
                          fontWeight: FontWeight.w500,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        table != null
                            ? "Connected successfully"
                            : "Required for Dine-in orders",
                        style: TextStyle(
                          color: table != null
                              ? AppColors.btnColor
                              : Colors.grey[600],
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  table != null
                      ? Icons.check_circle
                      : IconlyLight.arrow_right_2,
                  color: table != null ? AppColors.btnColor : Colors.grey[400],
                  size: 18,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w500,
        color: Color(0xFF2D3E2D),
      ),
    );
  }

  Widget _buildAddressCard() {
    return Consumer<AddressController>(
      builder: (context, controller, child) {
        final addr = controller.selectedAddress;
        return GestureDetector(
          onTap: _showAddressSheet,
          child: Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: const BoxDecoration(
                    color: Color(0xFFF1F8F1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    addr?['icon'] == 'home'
                        ? IconlyLight.home
                        : IconlyLight.work,
                    color: AppColors.btnColor,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        addr?['name'] ?? "Select Address",
                        style: const TextStyle(
                          fontWeight: FontWeight.w500,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        addr?['address'] ?? "Add a delivery address",
                        style: TextStyle(color: Colors.grey[600], fontSize: 11),
                      ),
                    ],
                  ),
                ),
                Icon(IconlyLight.edit, size: 18, color: Colors.grey[400]),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildPaymentCard() {
    return Consumer<PaymentController>(
      builder: (context, controller, child) {
        final method = controller.selectedMethod;
        return Column(
          children: [
            GestureDetector(
              onTap: _showPaymentSheet,
              child: Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: method != null
                        ? AppColors.btnColor.withOpacity(0.3)
                        : Colors.transparent,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: method != null
                            ? Color(
                                int.parse(
                                  method['color'].replaceAll('#', '0xFF'),
                                ),
                              )
                            : const Color(0xFFF1F8F1),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          method != null ? method['icon'] : "P",
                          style: TextStyle(
                            color: method != null
                                ? Color(
                                    int.parse(
                                      method['textColor'].replaceAll(
                                        '#',
                                        '0xFF',
                                      ),
                                    ),
                                  )
                                : AppColors.btnColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 15),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            method != null
                                ? method['name']
                                : "Select Payment Method",
                            style: const TextStyle(
                              fontWeight: FontWeight.w500,
                              fontSize: 13,
                            ),
                          ),
                          if (method != null)
                            Text(
                              "Tap to change method",
                              style: TextStyle(
                                color: Colors.grey[500],
                                fontSize: 11,
                              ),
                            ),
                        ],
                      ),
                    ),
                    Icon(
                      method != null
                          ? Icons.check_circle
                          : Icons.arrow_forward_ios,
                      color: method != null
                          ? AppColors.btnColor
                          : Colors.grey[300],
                      size: 18,
                    ),
                  ],
                ),
              ),
            ),
            if (method != null) ...[
              const SizedBox(height: 15),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 15),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  onChanged: (val) => setState(() => _phoneNumber = val),
                  decoration: InputDecoration(
                    hintText: "Enter ${method['name']} Number",
                    hintStyle: TextStyle(color: Colors.grey[400], fontSize: 13),
                    prefixIcon: const Icon(
                      IconlyLight.call,
                      size: 20,
                      color: AppColors.btnColor,
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 15),
                  ),
                ),
              ),
            ],
          ],
        );
      },
    );
  }

  Widget _buildConfirmButton(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(35)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SizedBox(
        width: double.infinity,
        height: 60,
        child:
            Consumer4<
              PaymentController,
              AddressController,
              CartController,
              OrderController
            >(
              builder: (context, payment, address, cart, orders, child) {
                bool isReady = _phoneNumber != null;

                if (_selectedOrderType == OrderType.delivery) {
                  isReady = isReady && address.selectedAddress != null;
                } else if (_selectedOrderType == OrderType.eating) {
                  isReady = isReady && cart.currentTable != null;
                }

                final auth = context.read<AuthController>();
                final isProcessing = orders.isLoading || payment.isLoading;

                return ElevatedButton(
                  onPressed: (!isReady || isProcessing)
                      ? () {
                          if (isProcessing) return;
                          if (_selectedOrderType == OrderType.eating &&
                              cart.currentTable == null) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  "Please scan table QR code first",
                                ),
                                backgroundColor: AppColors.secondaryColor,
                              ),
                            );
                            _navigateToScanner();
                          } else if (_selectedOrderType == OrderType.delivery &&
                              address.selectedAddress == null) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text("Please select delivery address"),
                                backgroundColor: AppColors.secondaryColor,
                              ),
                            );
                            _showAddressSheet();
                          } else if (_phoneNumber == null) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text("Please select payment method"),
                                backgroundColor: AppColors.secondaryColor,
                              ),
                            );
                            _showPaymentSheet();
                          }
                        }
                      : () async {
                          if (!auth.isAuthenticated) return;

                          // 1. Create Order (Pending)
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text("Creating order..."),
                              backgroundColor: AppColors.secondaryColor,
                            ),
                          );

                          final orderResult = await orders.placeOrder(
                            type: _selectedOrderType.name,
                            tableId: _selectedOrderType == OrderType.eating
                                ? cart.currentTable!['id']
                                : null,
                            addressId: _selectedOrderType == OrderType.delivery
                                ? address.selectedAddress!['id']
                                : null,
                            items: cart.cartItems,
                            token: auth.token!,
                            notes: "Ordered via App",
                          );

                          if (orderResult) {
                            final newOrder = orders.orders.first;
                            final orderId = newOrder['id'];

                            // 2. Request Payment
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text("Initiating payment..."),
                                backgroundColor: AppColors.primaryColor,
                              ),
                            );

                            final paymentSuccess = await payment.requestPayment(
                              orderId,
                              _phoneNumber!,
                            );

                            if (paymentSuccess && mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    "Payment Successful! Order Confirmed.",
                                  ),
                                  backgroundColor: Colors.green,
                                ),
                              );
                              cart.clearCart();
                              Navigator.pop(context);
                            } else if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    "Payment failed. Please check your phone or try again.",
                                  ),
                                  backgroundColor: Colors.red,
                                  duration: Duration(seconds: 5),
                                ),
                              );
                            }
                          } else if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  "Failed to create order. Please try again.",
                                ),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    elevation: 5,
                    shadowColor: AppColors.primaryColor.withOpacity(0.4),
                  ),
                  child: isProcessing
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          "Confirm Order",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                );
              },
            ),
      ),
    );
  }
}
