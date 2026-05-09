import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import 'package:provider/provider.dart';
import 'package:restaurant_delivery_app/features/payment/presentation/controllers/payment_controller.dart';
import 'package:restaurant_delivery_app/features/payment/presentation/widgets/payment_method_sheet.dart';
import 'package:restaurant_delivery_app/features/address/presentation/controllers/address_controller.dart';
import 'package:restaurant_delivery_app/features/address/presentation/widgets/address_selection_sheet.dart';
import 'package:restaurant_delivery_app/features/auth/presentation/controllers/auth_controller.dart';
import 'package:restaurant_delivery_app/features/auth/presentation/screens/login_screen.dart';
import '../../../../core/theme/colors.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String? _phoneNumber;

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
    });
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
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: const PaymentMethodSheet(),
      ),
    );

    if (result != null && result is String) {
      setState(() {
        _phoneNumber = result;
      });
    }
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
                _buildSectionTitle("Delivery Address"),
                const SizedBox(height: 10),
                _buildAddressCard(),
                const SizedBox(height: 25),
                _buildSectionTitle("Payment Method"),
                const SizedBox(height: 10),
                _buildPaymentCard(),
              ],
            ),
          ),
          _buildConfirmButton(context),
        ],
      ),
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
                    addr?['icon'] == 'home' ? IconlyLight.home : IconlyLight.work,
                    color: Colors.green,
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
                        style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
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
        return GestureDetector(
          onTap: _showPaymentSheet,
          child: Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: _phoneNumber != null ? Colors.green.withOpacity(0.3) : Colors.transparent,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: method != null 
                      ? Color(int.parse(method['color'].replaceAll('#', '0xFF')))
                      : const Color(0xFFF1F8F1),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      method != null ? method['icon'] : "P",
                      style: TextStyle(
                        color: method != null 
                          ? Color(int.parse(method['textColor'].replaceAll('#', '0xFF')))
                          : Colors.green,
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
                        method != null ? method['name'] : "Select Payment Method",
                        style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
                      ),
                      if (_phoneNumber != null)
                        Text(
                          _phoneNumber!,
                          style: TextStyle(color: Colors.grey[600], fontSize: 11),
                        ),
                    ],
                  ),
                ),
                Icon(
                  _phoneNumber != null ? Icons.check_circle : Icons.arrow_forward_ios,
                  color: _phoneNumber != null ? Colors.green : Colors.grey[300],
                  size: 18,
                ),
              ],
            ),
          ),
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
        child: Consumer2<PaymentController, AddressController>(
          builder: (context, payment, address, child) {
            final isReady = _phoneNumber != null && address.selectedAddress != null;
            return ElevatedButton(
              onPressed: (!isReady || payment.isLoading) 
                ? null 
                : () async {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Processing Order..."), backgroundColor: Colors.orange),
                  );
                  await Future.delayed(const Duration(seconds: 2));
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Order Placed Successfully!"), backgroundColor: Colors.green),
                    );
                    Navigator.pop(context);
                  }
                },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryColor,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                elevation: 5,
                shadowColor: AppColors.primaryColor.withOpacity(0.4),
              ),
              child: payment.isLoading 
                ? const CircularProgressIndicator(color: Colors.white)
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
