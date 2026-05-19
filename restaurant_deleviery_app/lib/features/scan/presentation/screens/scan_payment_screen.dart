import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import 'package:restaurant_delivery_app/features/cart/presentation/controllers/cart_controller.dart';
import '../controllers/scan_controller.dart';

class ScanPaymentScreen extends StatefulWidget {
  const ScanPaymentScreen({super.key});

  @override
  State<ScanPaymentScreen> createState() => _ScanPaymentScreenState();
}

class _ScanPaymentScreenState extends State<ScanPaymentScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ScanController>().resetScanner();
    });
  }

  Future<void> _onDetect(BuildContext context, BarcodeCapture capture) async {
    final controller = context.read<ScanController>();
    if (!controller.isScanning) return;
    
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final String? code = barcodes.first.rawValue;
      if (code != null) {
        controller.setScanning(false);
        final table = await controller.processScannedCode(code);
        
        if (table != null && context.mounted) {
          context.read<CartController>().setTable(table);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("Connected to ${table['name']}"),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context);
        } else if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(controller.error ?? "Invalid QR Code"),
              backgroundColor: Colors.red,
            ),
          );
          controller.setScanning(true);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Scan Table QR',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: Consumer<ScanController>(
        builder: (context, controller, child) {
          return Stack(
            children: [
              MobileScanner(
                onDetect: (capture) => _onDetect(context, capture),
              ),
              // Scanner Overlay
              Center(
                child: Container(
                  width: 260,
                  height: 260,
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.white.withOpacity(0.8), width: 3),
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: controller.isLoading 
                    ? const Center(child: CircularProgressIndicator(color: Colors.white))
                    : null,
                ),
              ),
              // Instructions
              Positioned(
                bottom: 80,
                left: 0,
                right: 0,
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      controller.isLoading ? "Validating..." : "Align Table QR inside the frame",
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
