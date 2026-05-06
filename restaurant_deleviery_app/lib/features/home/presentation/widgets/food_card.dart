import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

class FoodCard extends StatelessWidget {
  final String title;
  final String desc;
  final String? discount;
  final String image;
  final double price;
  final double? oldPrice;
  final VoidCallback? onTap;

  const FoodCard({
    super.key,
    required this.title,
    required this.desc,
    this.discount,
    required this.image,
    required this.price,
    this.oldPrice,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 110,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Row(
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.horizontal(left: Radius.circular(15)),
                  child: image.startsWith('http')
                      ? Image.network(
                          image,
                          width: 110,
                          height: 110,
                          fit: BoxFit.cover,
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return Shimmer.fromColors(
                              baseColor: Colors.grey[300]!,
                              highlightColor: Colors.grey[100]!,
                              child: Container(width: 110, height: 110, color: Colors.white),
                            );
                          },
                          errorBuilder: (context, error, stackTrace) => Container(width: 110, height: 110, color: Colors.grey[200], child: const Icon(Icons.image_not_supported, color: Colors.grey)),
                        )
                      : Image.asset(image, width: 110, height: 110, fit: BoxFit.cover),
                ),
                if (discount != null)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(color: const Color(0xFFFFD54F), borderRadius: BorderRadius.circular(5)),
                      child: Text(discount!, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)),
                    ),
                  ),
              ],
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.black87)),
                    const SizedBox(height: 4),
                    Text(desc, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: Colors.grey[500], fontSize: 11)),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text("\$${price.toStringAsFixed(2)}", style: const TextStyle(color: Color(0xFFFBC02D), fontWeight: FontWeight.bold, fontSize: 14)),
                      if (oldPrice != null)
                        Text("\$${oldPrice!.toStringAsFixed(2)}", style: TextStyle(color: Colors.grey[400], fontSize: 10, decoration: TextDecoration.lineThrough)),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: Color(0xFFA5D6A7), shape: BoxShape.circle),
                    child: const Icon(Icons.add, color: Color(0xFF2E7D32), size: 18),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
